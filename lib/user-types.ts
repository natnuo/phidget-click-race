export interface User {
  username: string;
  email: string;
  type: "clicker" | "reciever";
}

export const isUser = (obj: unknown): obj is User => {
  const _uobj = obj as User;
  return (
    typeof _uobj?.username === "string" &&
    typeof _uobj?.email === "string" &&
    (_uobj?.type === "clicker" || _uobj?.type === "reciever")
  );
};
