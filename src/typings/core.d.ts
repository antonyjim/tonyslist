/**
 * Create interfaces and classes for things missing from my off-the-shelf types
 */

interface AuthPayload {
    auth: boolean;
    userlevel: number;
    pid: string;
    cookie?: string;
}

interface PostCond {
    active: boolean;
    post: string; //Category
    post_pid: string;
}

interface Post {
    postPid: string;
    pid: string;
    title: string;
    zip: number;
    post: string; //Category
    desc: string;
    contact: string;
    price: number;
    createdOn: Date;
    lastViewed: Date;
    viewCount: number;
    active: boolean;
}

interface SimpleUser {
    username: string;
    email: string;
}

interface UserData {
    pid: string;
    username: string;
    pass: string;
    email: string;
    givenName: string;
    famName: string;
    userlevel: string;
    active?: boolean;
}

interface UserLogin {
    username: string;
    pass: string;
}

export { 
    PostCond, 
    AuthPayload,
    Post,
    UserData,
    UserLogin
}