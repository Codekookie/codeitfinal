import { addCommentToPost,
        getComments,
        updateComment,
        deleteComment, 
    } from '../services/commentService.js';

// 댓글달기 컨트롤러 
async function createCommentController(req, res) {
    const { postId } = req.params;
    const { nickname, content, password } = req.body;

    try {
        const comment = await addCommentToPost(postId, { nickname, content, password });
        res.status(200).json(comment);
    } catch (error) {
        if (error.message === 'Post not found') {
            res.status(404).json({ message: "Post not found" });
        } else {
            res.status(400).json({ message: "error", error: error.message });
        }
    }
}

//댓글 리스트 조회 컨트롤러 
async function getCommentsController(req, res) {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    try {
        const result = await getComments(postId, page, pageSize);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: "error", error: error.toString() });
    }
}

//댓글 수정 컨트롤러 
async function updateCommentController(req, res) {
    const { commentId } = req.params;
    const commentData = req.body;
    
    try {
        const updatedComment = await updateComment(Number(commentId), updateData);
        res.status(200).json(updatedComment);
      } catch (error) {
        if (error.message === '404_NOT_FOUND') {
          res.status(404).json({ message: '존재하지 않습니다' });
        } else if (error.message === '403_FORBIDDEN') {
          res.status(403).json({ message: '비밀번호가 틀렸습니다' });
        } else {
          res.status(400).json({ message: '잘못된 요청입니다' });
        }
      }

}

//댓글 삭제 컨트롤러 
async function deleteCommentController(req, res) {
    const { commentId } = req.params;
    const  password = req.body; 

    try {
        const deletedComment = await deleteComment(commentId, password);
        res.status(200).json({ message: '댓글 삭제 성공' });
    } catch (error) {
        if (error.message === '404_NOT_FOUND') {
            res.status(404).json({ message: '존재하지 않습니다' });
        } else if (error.message === '403_FORBIDDEN') {
            res.status(403).json({ message: '비밀번호가 틀렸습니다.' });
        } else {
            res.status(400).json({ message: '잘못된 요청입니다' });
        }
    }
}

export  { 
    createCommentController,
    getCommentsController,
    updateCommentController,
    deleteCommentController,
}