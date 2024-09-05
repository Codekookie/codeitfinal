import {
  createPost,
  getPosts,
  updatePost,
  deletePostById,
  getPostById,
  verifyPostPassword,
  likePost,
  getPostVisibility,
} from "../services/postServices.js";

import prisma from "../prismaClient.js";

import {
  addCommentToPost,
  getComments,
  updateComment,
  deleteComment,
} from "../services/commentService.js";

// 포스트 생성 컨트롤러
// async function createPostController(req, res) {
//   const { groupId } = req.params;

//   try {
//     const post = await createPost(Number(groupId), req.body);
//     res.status(201).json(post);
//   } catch (error) {
//     res.status(400).json({ message: "포스트 생성 오류", error: error.message });
//   }
// }
async function createPostController(req, res) {
  const { groupId } = req.params; // URL에서 groupId 추출

  try {
    const numericGroupId = Number(groupId);
    if (isNaN(numericGroupId)) {
      return res.status(400).json({ message: "유효하지 않은 그룹 ID입니다." });
    }

    // Prisma에서 고유한 그룹을 id 필드로 찾음
    const group = await prisma.group.findUnique({
      where: {
        id: numericGroupId, // 'key' 대신 'id' 필드 사용
      },
    });

    if (!group) {
      return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
    }

    // 여기서 포스트를 생성하는 로직 추가
    const post = await createPost(numericGroupId, req.body);
    res.status(201).json(post);
  } catch (error) {
    console.error("error : ", error);
    res.status(400).json({ message: "포스트 생성 오류", error: error.message });
  }
}

// 게시글 목록 조회 컨트롤러
async function getPostsController(req, res) {
  const { page, pageSize, sortBy, keyword, isPublic, groupId } = req.query;

  try {
    const posts = await getPosts({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      sortBy: sortBy || "latest",
      keyword: keyword || "",
      isPublic: isPublic === "true", // 'true' 문자열을 Boolean으로 변환
      groupId: Number(groupId),
    });

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(400)
      .json({ message: "게시글 목록 조회 오류", error: error.message });
  }
}

// 게시글 수정 컨트롤러
async function updatePostController(req, res) {
  const { postId } = req.params;
  const updateData = req.body;

  try {
    const updatedPost = await updatePost(Number(postId), updateData);
    res.status(200).json(updatedPost);
  } catch (error) {
    if (error.message === "404_NOT_FOUND") {
      res.status(404).json({ message: "존재하지 않습니다" });
    } else if (error.message === "403_FORBIDDEN") {
      res.status(403).json({ message: "비밀번호가 틀렸습니다" });
    } else {
      res.status(400).json({ message: "잘못된 요청입니다" });
    }
  }
}

// 게시글 삭제 컨트롤러
async function deletePostController(req, res) {
  const { postId } = req.params;
  const postPassword = req.body;

  try {
    const deletePost = await deletePostById(Number(postId), postPassword);
    res.status(200).json({ message: "게시글 삭제 성공" });
  } catch (error) {
    if (error.message === "404_NOT_FOUND") {
      res.status(404).json({ message: "존재하지 않습니다" });
    } else if (error.message === "403_FORBIDDEN") {
      res.status(403).json({ message: "비밀번호가 틀렸습니다." });
    } else {
      res.status(400).json({ message: "잘못된 요청입니다" });
    }
  }
}

//게시글 상세 조회 컨트롤러
async function getPostDetails(req, res) {
  try {
    const postId = req.params.postId;
    const post = await getPostById(postId);
    res.status(200).json(post);
  } catch (error) {
    if (error.message === "Post not found") {
      res.status(404).json({ message: "Post not found" });
    } else {
      res
        .status(400)
        .json({ message: "오류가 발생했습니다.", error: error.message });
    }
  }
}

//게시글 조회 권한 확인 컨트롤러
async function verifyPasswordController(req, res) {
  const { postId } = req.params;
  const { password } = req.body;

  try {
    await verifyPostPassword(postId, password);
    res.status(200).json({ message: "비밀번호가 확인되었습니다" });
  } catch (error) {
    if (error.message === "Post not found") {
      res.status(404).json({ message: "게시글을 찾을 수 없습니다" });
    } else if (error.message === "Password incorrect") {
      res.status(401).json({ message: "비밀번호가 틀렸습니다" });
    } else {
      res
        .status(400)
        .json({ message: "오류가 발생했습니다", error: error.message });
    }
  }
}

// 게시글 좋아요 컨트롤러
async function likePostController(req, res) {
  const { postId } = req.params;

  try {
    await likePost(postId);
    res.status(200).json({ message: "게시글 공감하기 성공" });
  } catch (error) {
    if (error.message === "Post not found") {
      res.status(404).json({ message: "존재하지 않습니다" });
    } else {
      res
        .status(400)
        .json({ message: "오류가 발생했습니다.", error: error.message });
    }
  }
}

// 게시글 공개여부 확인 컨트롤러
async function checkPostVisibilityController(req, res) {
  const { postId } = req.params;

  try {
    const post = await getPostVisibility(postId);
    res.status(200).json(post);
  } catch (error) {
    if (error.message === "Post not found") {
      res.status(404).json({ message: "존재하지 않습니다" });
    } else {
      res
        .status(400)
        .json({ message: "오류가 발생했습니다", error: error.message });
    }
  }
}

export {
  createPostController,
  getPostsController,
  updatePostController,
  deletePostController,
  getPostDetails,
  verifyPasswordController,
  likePostController,
  checkPostVisibilityController,
};
