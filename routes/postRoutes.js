import express from "express";
import {
  createPostController,
  getPostsController,
  updatePostController,
  deletePostController,
  getPostDetails,
  verifyPasswordController,
  likePostController,
  checkPostVisibilityController,
} from "../controllers/postController.js";
import {
  createCommentController,
  getCommentsController,
  updateCommentController,
  deleteCommentController,
} from "../controllers/commentController.js";

import upload from "../controllers/imageController.js";

const router = express.Router();

// 특정 그룹에 포스트 생성 라우트
router.post("/groups/:groupId/posts", createPostController);

// 포스트 목록 조회 라우트
router.get("/groups/:groupId/posts", getPostsController);

// 게시글 수정 라우트
router.put("/posts/:postId", updatePostController);

// 게시글 삭제 라우트
router.delete("/post/:postId", deletePostController);

// 게시글 상세 조회 라우트
router.get("/posts/:postId", getPostDetails);

// 게시글 조회 권한 확인 라우트
router.post("/posts/:postId/verify-password", verifyPasswordController);

// 게시글 좋아요 라우트
router.post("/posts/:postId/like", likePostController);

// 게시글 공개 여부 확인 라우트
router.get("/posts/:postId/visibility", checkPostVisibilityController);

// 댓글달기 라우터
router.post("/posts/:postId/comments", createCommentController);

// 댓글조회 라우터
router.get("/posts/:postId/comments", getCommentsController);

// 댓글 수정 라우터
router.put("/comments/:commentId", updateCommentController);

// 댓글 삭제 라우터
router.delete("comments/:commentId", deleteCommentController);

//이미지 라우터
router.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a file." });
  }
  res.status(200).json({
    imageUrl: req.file.location,
  });
});

export default router;
