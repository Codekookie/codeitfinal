import express from "express";
import postRoutes from "./routes/postRoutes.js";
import db from "./config/db.js"; //config 파일에서 db.js 파일 가져오자
import cors from "cors";
import { hashPassword } from "./services/passwordService.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", postRoutes); // 부분??

app.listen(4000, () => {
  console.log("서버가 열렸습니다");
});

//그룹 등록 완료
app.post("/groups", async (req, res) => {
  var { name, password, imageUrl, isPublic, introduction } = req.body;
  // 필수 필드 체크
  if (!name || !password) {
    return res.status(400).json({ message: "잘못된 요청입니다" });
  }
  password = await hashPassword(password);
  const today = new Date().toISOString().slice(0, 19).replace("T", " ");
  //console.log(  `${name}, ${password}, ${imageUrl}, ${isPublic}, ${introduction}, ${today}`); 디버깅

  const sql =
    "INSERT INTO `groups`(name, grouppassword, imageUrl, isPublic, createdAt ,introduction) VALUES (?,?,?,?,?,?)";

  db.query(
    sql,
    [name, password, imageUrl, isPublic, today, introduction],
    (err, results) => {
      if (err) {
        console.error("err :", err);
        return res.status(500).json({ message: "에러가 있습니다" });
      }

      res.status(201).json({
        id: results.insertId,
        name,
        imageUrl,
        isPublic,
        likeCount: 0,
        badges: [],
        postCount: 0,
        createdAt: today,
        introduction,
      });
    }
  );
});

// 수정! 양식검사만 미완성임 다른건 에러처리 완료
app.put("/groups/:id", async (req, res) => {
  var { name, password, imageUrl, isPublic, introduction } = req.body;
  const { id } = req.params;
  password = await hashPassword(password);
  console.log(password);
  // 필수 필드 체크 (유효성 검사)
  if (!name || !password || typeof isPublic === "undefined" || !introduction) {
    return res.status(400).json({ message: "잘못된 요청입니다" });
  }

  // 그룹의 현재 비밀번호를 가져오기 위한 쿼리
  const findGroupSql = "SELECT * FROM `groups` WHERE id = ?";
  db.query(findGroupSql, [id], (err, results) => {
    if (err) {
      console.error("Error finding Group_table:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    // 그룹이 존재하지 않는 경우
    if (results.length === 0) {
      return res.status(404).json({ message: "존재하지 않습니다" });
    }

    const group = results[0];

    // 비밀번호가 일치하지 않는 경우
    if (group.password !== password) {
      return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
    }

    // 비밀번호가 일치하면 업데이트 진행
    const updateSql = `
        UPDATE groups 
        SET name = ?, imageUrl = ?, isPublic = ?, introduction = ? 
        WHERE id = ?`;

    db.query(
      updateSql,
      [name, imageUrl, isPublic, introduction, id],
      (err, updateResults) => {
        if (err) {
          console.error("Error updating Group_table:", err);
          return res.status(500).json({ message: "Internal Server Error" });
        }

        // 업데이트된 그룹 정보를 다시 조회하여 응답
        const responseSql = "SELECT * FROM `groups` WHERE id = ?";
        db.query(responseSql, [id], (err, updatedResults) => {
          if (err)
            return res.status(500).json({ message: "Internal Server Error" });

          const updatedGroup = updatedResults[0];

          res.status(200).json({
            id: updatedGroup.id,
            name: updatedGroup.name,
            imageUrl: updatedGroup.imageUrl,
            isPublic: updatedGroup.isPublic,
            likeCount: updatedGroup.likeCount,
            badges: JSON.parse(updatedGroup.badges || "[]"),
            postCount: updatedGroup.postCount,
            createdAt: updatedGroup.createdAt,
            introduction: updatedGroup.introduction,
          });
        });
      }
    );
  });
});

// 그룹 삭제 에러 처리 수정완료
app.delete("/groups/:id", (req, res) => {
  const id = req.params.id;
  const inputPassword = req.body.password; // 클라이언트에서 전달된 비밀번호

  // 그룹의 비밀번호를 먼저 확인
  const sqlCheckPassword = "SELECT grouppassword FROM `groups` WHERE id=?";
  db.query(sqlCheckPassword, [id], (err, results) => {
    //양식 오류
    if (err) {
      return res.status(400).json({ error: "잘못된 요청입니다." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "그룹이 존재하지 않습니다." });
    }

    const storedPassword = results[0].password; // 데이터베이스에 저장된 비밀번호

    // 비밀번호 일치 여부 확인
    if (storedPassword !== inputPassword) {
      return res.status(403).json({ message: "비밀번호가 틀렸습니다." });
    }

    // 비밀번호가 일치하는 경우, 그룹 삭제 진행
    const sqlDelete = "delete from `groups` where id=?";
    db.query(sqlDelete, [id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: "잘못된 요청입니다." });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "그룹이 존재하지 않습니다." });
      }

      res.status(200).json({ message: "그룹 삭제 성공" });
    });
  });
});

// !!그룹 상세 정보 조회 에러처리 어느 정도 완료 양식오류 조건이 애매
app.get("/groups/:id", (req, res) => {
  const id = req.params.id;
  const sql = "select * from `groups` where id=?";
  db.query(sql, [id], (err, results, fileds) => {
    console.log("err", err);
    console.log("results", results);

    if (results.length === 0) {
      //result가 없을 때
      return res.status(400).json({ message: "잘못된 요청입니다" });
    }

    const sendData = {
      id: results[0].id,
      name: results[0].name,
      imageUrl: results[0].imageUrl,
      isPublic: results[0].isPublic,
      likeCount: results[0].likeCount,
      badges: results[0].badges,
      postCount: results[0].postCount,
      createdAt: results[0].createdAt,
      introduction: results[0].introduction,
    };

    res.send(sendData); // 결과 값이 있을 때
  });
});

//그룹 조회 권한 확인하기 에러 처리까지 완료
app.post("/groups/:id/vertify-password", (req, res) => {
  const id = req.params.id;
  const sql = "select * from `groups` where id=?";
  db.query(sql, [id], (err, results, fileds) => {
    if (results[0].password === req.body.password)
      res.status(200).json({ message: "비밀번호가 확인되었습니다" });
    else res.status(401).json({ message: "비밀번호가 틀렸습니다" });
  });
});

//그룹 공감하기 에러처리까지 완료
app.post("/groups/:id/like", (req, res) => {
  const id = req.params.id;
  const sql = "UPDATE `groups` SET likeCount= likeCount+1 WHERE ID = ?";
  db.query(sql, [id], (err, results, fileds) => {
    if (results.affectedRows > 0)
      res.status(200).json({ message: "그룹 공감하기 성공" });
    else res.status(404).json({ message: "존재하지 않습니다" });
  });
});

//공개된 그룹인지 확인 에러처리까지완료 | 해당 그룹이 존재하는가? -> 공개 여부 확인
app.get("/groups/:id/is-public", (req, res) => {
  const id = req.params.id;
  const sql = "select * from `groups` where id=?";
  db.query(sql, [id], (err, results, fileds) => {
    // 존재하는 그룹
    if (results.length > 0) {
      //공개
      if (results[0].isPublic === 1)
        res.status(200).json({ id: results[0].id, isPublic: 1 });
      //비공개
      else {
        res.status(200).json({ id: results[0].id, isPublic: 0 });
      }
      // 없는 그룹
    } else {
      res.status(404).json({ message: "해당 ID의 그룹을 찾을 수 없습니다." });
    }
  });
});
