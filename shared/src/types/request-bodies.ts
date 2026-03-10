export interface RegisterChannelBody {
    server_id: number;
    name: string;
    type: 'text' | 'voice';
}

export interface RegisterMessageBody {
    content: string;
    channel_id: number;
}

export interface RegisterServerBody {
    name: string;
    icon_url?: string;
}

export interface RegisterServerInviteBody {
    server_id: number;
    channel_id?: number;
    max_uses?: number;
    expires_at?: string;
    temporary?: boolean;
}

export interface RegisterDMMessageBody {
    content: string;
}

export interface RespondToFriendRequestBody {
    userId: number;
    action: 'accept' | 'reject';
}

export interface SendFriendRequestBody {
    userId: number;
}

export interface RemoveFriendRequestBody {
    userId: number;
}
