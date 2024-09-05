import prisma from '../prismaClient.js';
import { hashPassword } from './passwordService.js';


// 댓글 달기 함수 
async function addCommentToPost(postId, { nickname, content, password }) {
    const post = await prisma.post.findUnique({
        where: { id: Number(postId) }
    });

    if (!post) {
        throw new Error('Post not found');
    }
    password = hashPassword(password);

    const comment = await prisma.comment.create({
        data: {
            postId: Number(postId),
            nickname,
            content,
            password,
        }
    });

    return {
        id: comment.id,
        nickname: comment.nickname,
        content: comment.content,
        createdAt: comment.createdAt,
    };
}

// 댓글 목록 조회 함수 
async function getComments(postId, page, pagesize){
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [commentCount,comments] = await prisma.$transaction([
        prisma.comment.count({
            where: { postId: Number(postId) }
        }),
        prisma.findMany({
            where: { postId: Number(postId) },
            skip: skip,
            take: take,
            orderBy: {
                createdAt: 'desc'
            }
        })
    ]);

    const totalPages = Math.ceil(commentCount / pageSize);

    return {
        currentPage: page,
        totalPages,
        commentCount,
        data: comments.map(comment => ({
            id: comment.id,
            nickname: comment.nickname,
            content: comment.content,
            createdAt: comment.createdAt,
        }))
    };
}

// 댓글 수정 함수 
async function updateComment(commentId, commentData) {
        const { password, ...commentFeilds } = commentData;
        const orginComment = await prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!orginComment) {
            throw new Error('404_NOT_FOUND');
        }

        const isPasswordCorrect = await bcrypt.compare(password, orginComment.password);
        if (!isPasswordCorrect) {
            throw new Error('403_FORBIDDEN');
          }  
        

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: commentFeilds,
        })

        return updatedComment;
}

// 댓글 삭제 함수 
async function deleteComment(commentId, password) {
    const orginComment = await prisma.comment.findUnique({
        where: { id: commentId }
    });
    if (!orginComment) {
        throw new Error('404_NOT_FOUND');
    }

    const isPasswordCorrect = await bcrypt.compare(password, orginComment.password);
    if (!isPasswordCorrect) {
        throw new Error('403_FORBIDDEN');
      }  

    const deleteComment = await prisma.comment.delete({
        where: { id: commentId }
    })
}

export {
    addCommentToPost,
    getComments,
    updateComment,
    deleteComment,
}