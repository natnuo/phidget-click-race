export interface User {
    username: string;
    email: string;
    type: "clicker" | "reciever" | "cliciever";
}
export declare const isUser: (obj: unknown) => obj is User;
//# sourceMappingURL=user-types.d.ts.map