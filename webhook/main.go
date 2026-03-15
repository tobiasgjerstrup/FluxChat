package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

type PushEvent struct {
	Ref        string `json:"ref"`
	Repository struct {
		FullName string `json:"full_name"`
	} `json:"repository"`
}

func verifySignature(secret, signature string, body []byte) bool {
	if !strings.HasPrefix(signature, "sha256=") {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20)) // 1 MB limit
	if err != nil {
		http.Error(w, "failed to read body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	secret := os.Getenv("WEBHOOK_SECRET")
	if secret == "" {
		log.Println("WEBHOOK_SECRET is not set")
		http.Error(w, "server misconfigured", http.StatusInternalServerError)
		return
	}

	signature := r.Header.Get("X-Hub-Signature-256")
	if !verifySignature(secret, signature, body) {
		log.Printf("invalid signature from %s", r.RemoteAddr)
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	event := r.Header.Get("X-GitHub-Event")
	if event != "push" {
		w.WriteHeader(http.StatusAccepted)
		w.Write([]byte("ignored: not a push event"))
		return
	}

	var payload PushEvent
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	branch := os.Getenv("DEPLOY_BRANCH")
	if branch == "" {
		branch = "main"
	}
	expectedRef := "refs/heads/" + branch

	if payload.Ref != expectedRef {
		log.Printf("push to %s ignored (watching %s)", payload.Ref, expectedRef)
		w.WriteHeader(http.StatusAccepted)
		w.Write([]byte("ignored: wrong branch"))
		return
	}

	log.Printf("deploying %s @ %s", payload.Repository.FullName, payload.Ref)

	deployScript := os.Getenv("DEPLOY_SCRIPT")
	if deployScript == "" {
		deployScript = "./deploy.sh"
	}

	cmd := exec.Command("/bin/sh", deployScript)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Printf("deploy script failed: %v", err)
		http.Error(w, "deploy failed", http.StatusInternalServerError)
		return
	}

	log.Println("deploy completed successfully")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("deployed"))
}

func main() {
	port := os.Getenv("WEBHOOK_PORT")
	if port == "" {
		port = "9153"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/webhook/", webhookHandler)

	log.Printf("webhook listener starting on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
