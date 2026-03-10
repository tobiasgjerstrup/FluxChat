export type User = {
    readonly id: number;
    username: string;
    email: string;
    password: string;
};

export type RegisterBody = Omit<User, 'id'>;
export type LoginBody = Omit<User, 'email' | 'id'>;
