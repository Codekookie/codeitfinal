import bcrypt from "bcrypt";
import prisma from "../prismaClient.js";

// 비밀번호를 해시로 변환하는 함수
async function hashPassword(plainPassword) {
  const saltRounds = 10; // 해시 강도
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("비밀번호 해싱 중 오류 발생:", error);
    throw new Error("비밀번호 해싱 중 오류 발생");
  }
}

// 그룹 비밀번호가 일치하는지 확인하는 함수
async function validateGroupPassword(groupId, password) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error("그룹을 찾을 수 없습니다.");
  }
  const isValid = await bcrypt.compare(password, group.password);
  return isValid;
}

export { hashPassword, validateGroupPassword };
