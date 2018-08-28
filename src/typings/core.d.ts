/**
 * Create interfaces and classes for things missing from my off-the-shelf types
 */

interface MidAuth {
    auth: boolean;
    userlevel?: number;
    user?: string;
    cookie?: string;
}

interface PostCond {
    active: boolean;
    post: string; //Category
    post_pid: string;
}


 export { MidAuth, PostCond };