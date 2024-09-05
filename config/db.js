import mysql from "mysql2"; // promise 지원하는 mysql2 모듈 사용
import dotenv from "dotenv"; // 환경변수 사용을 위해 dotenv 로드

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: "3306", //서버 포트가 아니라 mysql포트임
  database: process.env.DB_DATABASE,
}); //db 정보

db.connect((err) => {
  console.log("db 연결 성공!");
  console.log("err", err); //에러만 출력
}); //db접속

export default db;
