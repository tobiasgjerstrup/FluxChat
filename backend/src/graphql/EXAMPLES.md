# GraphQL Query Examples

## Testing with curl

### 1. Register a new user

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(username: \"testuser\", email: \"test@example.com\", password: \"password123\") { token refresh_token user { id username email } } }"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(email: \"test@example.com\", password: \"password123\") { token refresh_token user { id username } } }"
  }'
```

### 3. Get all users (authenticated)

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "query { users { id username email avatar_url created_at } }"
  }'
```

### 4. Get current user

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "query { me { id username email avatar_url } }"
  }'
```

### 5. Create a server

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "mutation { createServer(name: \"My Server\", icon_url: \"https://example.com/icon.png\") { id name owner_id created_at } }"
  }'
```

### 6. Get user's servers

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "query { userServers(user_id: 1) { id name owner_id channels { id name type } } }"
  }'
```

### 7. Create a channel

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "mutation { createChannel(server_id: 1, name: \"general\", type: \"text\", topic: \"General discussion\") { id name type topic } }"
  }'
```

### 8. Send a message

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "mutation { createMessage(channel_id: 1, content: \"Hello world!\") { id content created_at author { username } } }"
  }'
```

### 9. Get channel messages

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "query { channelMessages(channel_id: 1, limit: 10) { id content created_at author { id username avatar_url } } }"
  }'
```

### 10. Create DM channel

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "mutation { createDMChannel(user_ids: [2, 3], is_group: false) { id is_group participants { id username } } }"
  }'
```

## Testing with JavaScript/Node.js

```javascript
async function testGraphQL() {
    // 1. Register
    const registerResponse = await fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `
        mutation {
          register(username: "testuser", email: "test@example.com", password: "password123") {
            token
            user { id username }
          }
        }
      `,
        }),
    });

    const {
        data: { register },
    } = await registerResponse.json();
    const token = register.token;

    // 2. Create server
    const serverResponse = await fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            query: `
        mutation {
          createServer(name: "My Server") {
            id
            name
          }
        }
      `,
        }),
    });

    const {
        data: { createServer },
    } = await serverResponse.json();
    console.log('Server created:', createServer);
}
```

## Testing with Postman

1. Create a new POST request to `http://localhost:3000/graphql`
2. Set Headers:
    - `Content-Type: application/json`
    - `Authorization: Bearer YOUR_TOKEN` (for authenticated requests)
3. In the Body tab, select "GraphQL" option
4. Enter your query in the query field

Example query:

```graphql
query {
    users {
        id
        username
        email
    }
}
```

## Common Issues

### "GraphQL operations must contain a non-empty query"

- **Cause:** Request body is missing or malformed
- **Solution:** Ensure you're sending a POST request with `Content-Type: application/json` and the body contains `{"query": "your graphql query"}`

### "Not authenticated"

- **Cause:** Missing or invalid JWT token
- **Solution:** Include `Authorization: Bearer YOUR_TOKEN` header after logging in/registering

### Network errors

- **Cause:** Server not running or wrong port
- **Solution:** Ensure the backend server is running on the correct port (default: 3000)
