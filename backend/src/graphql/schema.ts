export const typeDefs = `
  scalar DateTime

  # User type
  type User {
    id: Int!
    username: String!
    email: String!
    avatar_url: String
    created_at: DateTime!
    last_online_at: DateTime
    status: UserStatus
    servers: [Server!]!
    direct_messages: [DMChannel!]!
  }

  type UserStatus {
    user_id: Int!
    status: String!
    custom_status: String
    updated_at: DateTime!
  }

  # Server types
  type Server {
    id: Int!
    owner_id: Int!
    name: String!
    icon_url: String
    created_at: DateTime!
    owner: User!
    members: [ServerMember!]!
    channels: [Channel!]!
    roles: [Role!]!
    invites: [ServerInvite!]!
    bans: [ServerBan!]!
    audit_logs: [AuditLog!]!
  }

  type ServerMember {
    id: Int!
    server_id: Int!
    user_id: Int!
    nickname: String
    joined_at: DateTime!
    user: User!
    server: Server!
    roles: [Role!]!
  }

  type Role {
    id: Int!
    server_id: Int!
    name: String!
    color: String
    position: Int
    permissions: String
    server: Server!
  }

  type MemberRole {
    id: Int!
    member_id: Int!
    role_id: Int!
  }

  # Channel types
  type Channel {
    id: Int!
    server_id: Int!
    name: String!
    type: String!
    parent_id: Int
    position: Int
    topic: String
    created_at: DateTime!
    server: Server!
    messages: [Message!]!
    permissions: [ChannelPermission!]!
  }

  type ChannelPermission {
    id: Int!
    channel_id: Int!
    role_id: Int
    user_id: Int
    allow: String
    deny: String
    channel: Channel!
  }

  # Message types
  type Message {
    id: Int!
    channel_id: Int!
    author_id: Int!
    content: String!
    created_at: DateTime!
    edited_at: DateTime
    reply_to_id: Int
    channel: Channel!
    author: User!
    reply_to: Message
    attachments: [MessageAttachment!]!
    reactions: [MessageReaction!]!
  }

  type MessageAttachment {
    id: Int!
    message_id: Int!
    url: String!
    filename: String
    size_bytes: Int
    message: Message!
  }

  type MessageReaction {
    id: Int!
    message_id: Int!
    user_id: Int!
    emoji: String!
    user: User!
    message: Message!
  }

  # Direct Message types
  type DMChannel {
    id: Int!
    is_group: Boolean!
    created_at: DateTime!
    participants: [User!]!
    messages: [DMMessage!]!
  }

  type DMMessage {
    id: Int!
    dm_channel_id: Int!
    author_id: Int!
    content: String!
    created_at: DateTime!
    edited_at: DateTime
    dm_channel: DMChannel!
    author: User!
  }

  # Server management types
  type ServerBan {
    id: Int!
    server_id: Int!
    user_id: Int!
    banned_by_id: Int!
    reason: String
    created_at: DateTime!
    expires_at: DateTime
    unbanned_by_id: Int
    unbanned_at: DateTime
    server: Server!
    user: User!
    banned_by: User!
    unbanned_by: User
  }

  type AuditLog {
    id: Int!
    server_id: Int!
    actor_id: Int!
    action_type: String!
    target_user_id: Int
    target_role_id: Int
    target_channel_id: Int
    target_message_id: Int
    metadata: String
    created_at: DateTime!
    server: Server!
    actor: User!
  }

  type ServerInvite {
    id: Int!
    code: String!
    server_id: Int!
    channel_id: Int
    creator_id: Int!
    max_uses: Int
    uses: Int!
    expires_at: DateTime
    temporary: Boolean!
    revoked: Boolean!
    created_at: DateTime!
    server: Server!
    creator: User!
  }

  # Notification type
  type Notification {
    id: Int!
    user_id: Int!
    type: String!
    data: String
    created_at: DateTime!
    read_at: DateTime
    user: User!
  }

  # Query type
  type Query {
    # User queries
    user(id: Int!): User
    me: User
    users: [User!]!
    userByUsername(username: String!): User

    # Server queries
    server(id: Int!): Server
    servers: [Server!]!
    userServers(user_id: Int!): [Server!]!

    # Channel queries
    channel(id: Int!): Channel
    serverChannels(server_id: Int!): [Channel!]!

    # Message queries
    message(id: Int!): Message
    channelMessages(channel_id: Int!, limit: Int, offset: Int): [Message!]!

    # DM queries
    dmChannel(id: Int!): DMChannel
    userDMChannels(user_id: Int!): [DMChannel!]!
    dmMessages(dm_channel_id: Int!, limit: Int, offset: Int): [DMMessage!]!

    # Server member queries
    serverMembers(server_id: Int!): [ServerMember!]!
    serverMember(server_id: Int!, user_id: Int!): ServerMember

    # Role queries
    serverRoles(server_id: Int!): [Role!]!
    role(id: Int!): Role

    # Invite queries
    serverInvite(code: String!): ServerInvite
    serverInvites(server_id: Int!): [ServerInvite!]!

    # Notification queries
    userNotifications(user_id: Int!): [Notification!]!
  }

  # Mutation type
  type Mutation {
    # User mutations
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateUser(id: Int!, username: String, avatar_url: String): User
    updateUserStatus(user_id: Int!, status: String!, custom_status: String): UserStatus

    # Server mutations
    createServer(name: String!, icon_url: String): Server!
    updateServer(id: Int!, name: String, icon_url: String): Server
    deleteServer(id: Int!): Boolean!

    # Channel mutations
    createChannel(server_id: Int!, name: String!, type: String!, topic: String): Channel!
    updateChannel(id: Int!, name: String, topic: String): Channel
    deleteChannel(id: Int!): Boolean!

    # Message mutations
    createMessage(channel_id: Int!, content: String!, reply_to_id: Int): Message!
    editMessage(id: Int!, content: String!): Message
    deleteMessage(id: Int!): Boolean!
    addMessageReaction(message_id: Int!, emoji: String!): MessageReaction!
    removeMessageReaction(message_id: Int!, emoji: String!): Boolean!

    # DM mutations
    createDMChannel(user_ids: [Int!]!, is_group: Boolean): DMChannel!
    sendDMMessage(dm_channel_id: Int!, content: String!): DMMessage!
    editDMMessage(id: Int!, content: String!): DMMessage
    deleteDMMessage(id: Int!): Boolean!

    # Server member mutations
    addServerMember(server_id: Int!, user_id: Int!): ServerMember!
    removeServerMember(server_id: Int!, user_id: Int!): Boolean!
    updateServerMemberNickname(server_id: Int!, user_id: Int!, nickname: String): ServerMember

    # Role mutations
    createRole(server_id: Int!, name: String!, color: String, position: Int, permissions: String): Role!
    updateRole(id: Int!, name: String, color: String, permissions: String): Role
    deleteRole(id: Int!): Boolean!
    assignRoleToMember(member_id: Int!, role_id: Int!): Boolean!
    removeRoleFromMember(member_id: Int!, role_id: Int!): Boolean!

    # Invite mutations
    createServerInvite(server_id: Int!, max_uses: Int, expires_at: DateTime, temporary: Boolean): ServerInvite!
    revokeServerInvite(id: Int!): Boolean!
    useServerInvite(code: String!): ServerMember!

    # Ban mutations
    banServerMember(server_id: Int!, user_id: Int!, reason: String, expires_at: DateTime): ServerBan!
    unbanServerMember(server_id: Int!, user_id: Int!): Boolean!

    # Notification mutations
    markNotificationAsRead(id: Int!): Notification
  }

  # Auth payload
  type AuthPayload {
    token: String!
    refresh_token: String!
    user: User!
  }
`;
