export type DBId = number;
export type DBDatetime = string;

export interface DBUser {
    readonly id: DBId;
    username: string;
    email: string;
    password_hash: string;
    avatar_url: string | null;
    readonly created_at: DBDatetime;
    last_online_at: DBDatetime | null;
}

export type DBCreateUser = Omit<DBUser, 'id' | 'created_at' | 'last_online_at'> &
    Partial<Pick<DBUser, 'avatar_url' | 'last_online_at'>>;
export type DBPatchUser = Partial<Omit<DBUser, 'id' | 'created_at'>>;

export interface DBServer {
    readonly id: DBId;
    owner_id: DBUser['id'];
    name: string;
    icon_url: string | null;
    readonly created_at: DBDatetime;
}

export type DBCreateServer = Omit<DBServer, 'id' | 'created_at'>;
export type DBPatchServer = Partial<Omit<DBServer, 'id' | 'created_at' | 'owner_id'>>;

export interface DBServerMember {
    readonly id: DBId;
    server_id: DBServer['id'];
    user_id: DBUser['id'];
    nickname: string | null;
    readonly joined_at: DBDatetime;
}

export type DBCreateServerMember = Omit<DBServerMember, 'id' | 'joined_at'>;
export type DBPatchServerMember = Partial<Pick<DBServerMember, 'nickname'>>;

export interface DBRole {
    readonly id: DBId;
    server_id: DBServer['id'];
    name: string;
    color: string | null;
    position: number | null;
    permissions: string | null;
}

export type DBCreateRole = Omit<DBRole, 'id'>;
export type DBPatchRole = Partial<Omit<DBRole, 'id' | 'server_id'>>;

export interface DBMemberRole {
    readonly id: DBId;
    member_id: DBServerMember['id'];
    role_id: DBRole['id'];
}

export type DBCreateMemberRole = Omit<DBMemberRole, 'id'>;

export interface DBChannel {
    readonly id: DBId;
    server_id: DBServer['id'];
    name: string;
    type: string;
    parent_id: DBChannel['id'] | null;
    position: number | null;
    topic: string | null;
    readonly created_at: DBDatetime;
}

export type DBCreateChannel = Omit<DBChannel, 'id' | 'created_at'>;
export type DBPatchChannel = Partial<Omit<DBChannel, 'id' | 'server_id' | 'created_at'>>;

export interface DBChannelPermission {
    readonly id: DBId;
    channel_id: DBChannel['id'];
    role_id: DBRole['id'] | null;
    user_id: DBUser['id'] | null;
    allow: string | null;
    deny: string | null;
}

export type DBCreateChannelPermission = Omit<DBChannelPermission, 'id'>;
export type DBPatchChannelPermission = Partial<Omit<DBChannelPermission, 'id' | 'channel_id'>>;

export interface DBMessage {
    readonly id: DBId;
    channel_id: DBChannel['id'];
    author_id: DBUser['id'];
    content: string;
    readonly created_at: DBDatetime;
    edited_at: DBDatetime | null;
    reply_to_id: DBMessage['id'] | null;
}

export type DBCreateMessage = Omit<DBMessage, 'id' | 'created_at' | 'edited_at'>;
export type DBPatchMessage = Partial<Pick<DBMessage, 'content' | 'edited_at'>>;

export interface DBMessageAttachment {
    readonly id: DBId;
    message_id: DBMessage['id'];
    url: string;
    filename: string | null;
    size_bytes: number | null;
}

export type DBCreateMessageAttachment = Omit<DBMessageAttachment, 'id'>;
export type DBPatchMessageAttachment = Partial<Pick<DBMessageAttachment, 'filename' | 'size_bytes'>>;

export interface DBMessageReaction {
    readonly id: DBId;
    message_id: DBMessage['id'];
    user_id: DBUser['id'];
    emoji: string;
}

export type DBCreateMessageReaction = Omit<DBMessageReaction, 'id'>;

export interface DBDMChannel {
    readonly id: DBId;
    is_group: boolean;
    readonly created_at: DBDatetime;
}

export type DBCreateDMChannel = Omit<DBDMChannel, 'id' | 'created_at'>;

export interface DBDMParticipant {
    readonly id: DBId;
    dm_channel_id: DBDMChannel['id'];
    user_id: DBUser['id'];
}

export type DBCreateDMParticipant = Omit<DBDMParticipant, 'id'>;

export interface DBDMMessage {
    readonly id: DBId;
    dm_channel_id: DBDMChannel['id'];
    author_id: DBUser['id'];
    content: string;
    readonly created_at: DBDatetime;
    edited_at: DBDatetime | null;
}

export type DBCreateDMMessage = Omit<DBDMMessage, 'id' | 'created_at' | 'edited_at'>;
export type DBPatchDMMessage = Partial<Pick<DBDMMessage, 'content' | 'edited_at'>>;

export interface DBUserStatus {
    user_id: DBUser['id'];
    status: string;
    custom_status: string | null;
    readonly updated_at: DBDatetime;
}

export type DBCreateUserStatus = Omit<DBUserStatus, 'updated_at'>;
export type DBPatchUserStatus = Partial<Pick<DBUserStatus, 'status' | 'custom_status'>>;

export interface DBNotification {
    readonly id: DBId;
    user_id: DBUser['id'];
    type: string;
    data: string | null;
    readonly created_at: DBDatetime;
    read_at: DBDatetime | null;
}

export type DBCreateNotification = Omit<DBNotification, 'id' | 'created_at' | 'read_at'>;
export type DBPatchNotification = Partial<Pick<DBNotification, 'read_at' | 'data'>>;

export interface DBServerBan {
    readonly id: DBId;
    server_id: DBServer['id'];
    user_id: DBUser['id'];
    banned_by_id: DBUser['id'];
    reason: string | null;
    readonly created_at: DBDatetime;
    expires_at: DBDatetime | null;
    unbanned_by_id: DBUser['id'] | null;
    unbanned_at: DBDatetime | null;
}

export type DBCreateServerBan = Omit<DBServerBan, 'id' | 'created_at' | 'unbanned_by_id' | 'unbanned_at'>;
export type DBPatchServerBan = Partial<Pick<DBServerBan, 'expires_at' | 'unbanned_by_id' | 'unbanned_at' | 'reason'>>;

export interface DBAuditLog {
    readonly id: DBId;
    server_id: DBServer['id'];
    actor_id: DBUser['id'];
    action_type: string;
    target_user_id: DBUser['id'] | null;
    target_role_id: DBRole['id'] | null;
    target_channel_id: DBChannel['id'] | null;
    target_message_id: DBMessage['id'] | null;
    metadata: string | null;
    readonly created_at: DBDatetime;
}

export type DBCreateAuditLog = Omit<DBAuditLog, 'id' | 'created_at'>;

export interface DBServerInvite {
    readonly id: DBId;
    code: string;
    server_id: DBServer['id'];
    channel_id: DBChannel['id'] | null;
    creator_id: DBUser['id'];
    max_uses: number | null;
    uses: number;
    expires_at: DBDatetime | null;
    temporary: boolean;
    revoked: boolean;
    readonly created_at: DBDatetime;
}

export type DBCreateServerInvite = Omit<DBServerInvite, 'id' | 'uses' | 'created_at'>;
export type DBPatchServerInvite = Partial<
    Pick<DBServerInvite, 'max_uses' | 'expires_at' | 'temporary' | 'revoked' | 'channel_id'>
>;

export interface DBRefreshToken {
    readonly id: DBId;
    user_id: DBUser['id'];
    token: string;
    readonly created_at: DBDatetime;
    expires_at: DBDatetime;
}

export type DBCreateRefreshToken = Omit<DBRefreshToken, 'id' | 'created_at'>;

export type DBFriendStatus = 'pending' | 'accepted' | 'blocked';

export interface DBFriend {
    readonly id: DBId;
    user_id: DBUser['id'];
    friend_id: DBUser['id'];
    status: DBFriendStatus;
    readonly created_at: DBDatetime;
    updated_at: DBDatetime | null;
}

export type DBCreateFriend = Omit<DBFriend, 'id' | 'created_at' | 'updated_at'>;
export type DBPatchFriend = Partial<Pick<DBFriend, 'status' | 'updated_at'>>;
