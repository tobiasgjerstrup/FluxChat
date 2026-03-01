# FluxChat GraphQL API

GraphQL API for FluxChat backend powered by Apollo Server 5.

## Setup

The GraphQL server is integrated with Express and runs on `/graphql` endpoint.

### Dependencies

- `@apollo/server` - Core Apollo Server
- `@as-integrations/express5` - Express 5 integration for Apollo Server
- `graphql` - GraphQL implementation
- `graphql-subscriptions` - For real-time subscriptions
- `graphql-tag` - For parsing GraphQL schemas

## Usage

### Making GraphQL Requests

The GraphQL endpoint accepts POST requests to `/graphql` with JSON bodies:

**Using curl:**

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ users { id username } }"}'
```

**Using fetch:**

```javascript
fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        query: `
      query {
        users {
          id
          username
        }
      }
    `,
    }),
});
```

**Important:**

- Requests must be sent as POST
- Content-Type must be `application/json`
- The query must be in the request body as a JSON object with a `query` field

### GraphQL Playground

Apollo Server 5 does not include GraphQL Playground by default. To test queries, you can:

1. Use a GraphQL client like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/)
2. Use [Apollo Studio Sandbox](https://studio.apollographql.com/sandbox/explorer) and point it to `http://localhost:3000/graphql`
3. Install a browser extension like GraphQL Playground or Altair GraphQL Client

### Authentication

Include a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token by using the `login` or `register` mutations.

## Schema Overview

### Types

- **User** - User accounts with status and relationships
- **Server** - Discord-like servers with channels, roles, and members
- **Channel** - Text/voice channels within servers
- **Message** - Messages sent in channels
- **DMChannel** - Direct message channels between users
- **DMMessage** - Messages in DM channels
- **Role** - Server roles with permissions
- **ServerInvite** - Invitation codes for joining servers
- **Notification** - User notifications

### Key Queries

```graphql
# Get current user
query {
    me {
        id
        username
        email
        avatar_url
    }
}

# Get user's servers
query {
    userServers(user_id: 1) {
        id
        name
        owner_id
        channels {
            id
            name
            type
        }
    }
}

# Get channel messages
query {
    channelMessages(channel_id: 1, limit: 50) {
        id
        content
        created_at
        author {
            username
            avatar_url
        }
    }
}
```

### Key Mutations

```graphql
# Register a new user
mutation {
    register(username: "newuser", email: "user@example.com", password: "password123") {
        token
        refresh_token
        user {
            id
            username
        }
    }
}

# Create a server
mutation {
    createServer(name: "My Server", icon_url: "https://...") {
        id
        name
        owner_id
    }
}

# Send a message
mutation {
    createMessage(channel_id: 1, content: "Hello world!") {
        id
        content
        created_at
        author {
            username
        }
    }
}

# Create a DM channel
mutation {
    createDMChannel(user_ids: [2, 3], is_group: false) {
        id
        participants {
            username
        }
    }
}
```

## Implementation Details

### Database

The GraphQL resolvers interact with the SQLite database through `better-sqlite3`. The database is initialized in `/backend/src/db/sqlite.ts`.

### File Structure

```
backend/src/graphql/
├── schema.ts      # GraphQL type definitions
├── resolvers.ts   # Query and mutation resolvers
├── server.ts      # Apollo Server setup
└── README.md      # This file
```

### Context

The GraphQL context includes authenticated user information extracted from JWT tokens:

```typescript
{
  user?: {
    id: number;
    username: string;
  }
}
```

### Error Handling

Resolvers throw errors for:

- Database not initialized
- User not authenticated (for protected operations)
- Invalid input data
- Database constraint violations

## Development

### Adding New Types

1. Update `schema.ts` with new GraphQL types
2. Add corresponding resolvers in `resolvers.ts`
3. Ensure database tables exist in `db/sqlite.ts`

### Testing Queries

Use the GraphQL playground at `/graphql` to test queries and mutations interactively.

## Notes

- All datetime fields use ISO 8601 format
- The `DateTime` scalar is automatically serialized/parsed
- Nested queries use field resolvers for efficient data fetching
- Authentication is required for most mutations and some queries
