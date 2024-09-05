import { hashPassword, validateGroupPassword } from "./passwordService.js";
import bcrypt from "bcrypt"; // bcrypt 라이브러리를 import

import prisma from "../prismaClient.js";

// 포스트 생성 함수
async function createPost(groupId, postData) {
  const {
    nickname,
    title,
    content,
    postPassword,
    groupPassword,
    imageUrl,
    tags,
    location,
    moment,
    isPublic,
  } = postData;

  // 필수 필드가 있는지 확인
  if (
    !nickname ||
    !title ||
    !content ||
    !postPassword ||
    !groupPassword ||
    !moment ||
    isPublic === undefined
  ) {
    throw new Error("잘못된 입력입니다.");
  }

  //비밀번호 해싱 및 검증
  const isGroupPasswordValid = await validateGroupPassword(
    groupId,
    groupPassword
  );
  if (!isGroupPasswordValid) {
    throw new Error("잘못된 비밀번호 입니다.");
  }

  //포스트 비밀번호 해싱
  postPassword = await hashPassword(postPassword);

  const post = await prisma.post.create({
    groupId,
    nickname,
    title,
    content,
    postPassword,
    groupPassword,
    imageUrl,
    tags: new Array(...postData.tags),
    location,
    moment,
    isPublic,
  });
  return post;
}

// 포스트 목록을 조회하는 함수
async function getPosts({
  page = 1,
  pageSize = 10,
  sortBy = "latest",
  keyword = "",
  isPublic = true,
  groupId,
}) {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // 정렬 기준 설정
  const orderBy = (() => {
    switch (sortBy) {
      case "mostCommented":
        return { commentCount: "desc" };
      case "mostLiked":
        return { likeCount: "desc" };
      case "latest":
      default:
        return { createdAt: "desc" };
    }
  })();

  // 검색 및 필터링 조건 설정
  const where = {
    isPublic: isPublic,
    groupId: groupId,
    OR: keyword
      ? [
          { title: { contains: keyword, mode: "insensitive" } },
          { content: { contains: keyword, mode: "insensitive" } },
        ]
      : undefined,
  };

  // 데이터베이스 쿼리
  const [totalItemCount, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
  ]);

  const totalPages = Math.ceil(totalItemCount / pageSize);

  return {
    currentPage: page,
    totalPages,
    totalItemCount,
    data: posts,
  };
}

// 특정 그룹의 포스트 목록을 조회하는 함수
async function getPostsByGroupId(groupId) {
  const posts = await prisma.post.findMany({
    where: { groupId },
  });
  return posts;
}

// 포스트를 수정하는 함수
async function updatePost(postId, updateData) {
  const { postPassword, ...updateFields } = updateData;

  const originPost = await prisma.post.findUnique({
    where: { id: postId },
  });
  if (!originPost) {
    throw new Error("404_NOT_FOUND");
  }

  // 비밀번호 검증
  const isPasswordCorrect = await bcrypt.compare(
    postPassword,
    originPost.password
  );
  if (!isPasswordCorrect) {
    throw new Error("403_FORBIDDEN");
  }
  // 게시글 업데이트
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: updateFields,
  });

  return updatedPost;
}

// postId로 게시글 삭제하는 함수
async function deletePostById(postId, postPassword) {
  const originPost = await prisma.post.findUnique({
    where: { id: postId },
  });
  if (!originPost) {
    throw new Error("404_NOT_FOUND");
  }

  // 비밀번호 검증
  const isPasswordCorrect = await bcrypt.compare(
    postPassword,
    originPost.password
  );
  if (!isPasswordCorrect) {
    throw new Error("403_FORBIDDEN");
  }

  return await prisma.post.delete({
    where: { id: postId },
  });
}

// 게시글 상세 조회 함수
async function getPostById(postId) {
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
    select: {
      id: true,
      groupId: true,
      nickname: true,
      title: true,
      content: true,
      imageUrl: true,
      tags: true,
      location: true,
      moment: true,
      isPublic: true,
      likeCount: true,
      commentCount: true,
      createdAt: true,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }
  return post;
}

// 게시글 조회 권한 확인 함수
async function verifyPostPassword(postId, password) {
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
    select: {
      postPassword: true,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  const isMatch = await bcrypt.compare(password, post.postPassword);
  if (!isMatch) {
    throw new Error("Password incorrect");
  }

  return isMatch;
}

// 게시글 좋아요 함수
async function likePost(postId) {
  const post = await prisma.post.update({
    where: { id: Number(postId) },
    data: {
      likeCount: {
        increment: 1,
      },
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  return post;
}

//게시글 공개 여부 확인
async function getPostVisibility(postId) {
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
    select: {
      id: true,
      isPublic: true,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }
  return post;
}

export {
  createPost,
  getPosts,
  getPostsByGroupId,
  updatePost,
  deletePostById,
  getPostById,
  verifyPostPassword,
  likePost,
  getPostVisibility,
};
