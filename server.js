const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MySQL 연결 설정
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'asdf1234',  // MySQL 비밀번호 입력
    port: 3306
};

let pool;

// 데이터베이스 초기화
async function initDatabase() {
    // 먼저 기본 연결로 snake_game 데이터베이스 생성
    const initConnection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        port: dbConfig.port
    });

    try {
        await initConnection.query('CREATE DATABASE IF NOT EXISTS snake_game');
        console.log('데이터베이스 확인/생성 완료');
    } finally {
        await initConnection.end();
    }

    // 실제 데이터베이스에 연결 풀 생성
    pool = mysql.createPool({
        ...dbConfig,
        database: 'snake_game',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // 테이블 생성
    await pool.query(`
        CREATE TABLE IF NOT EXISTS rankings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            score INT NOT NULL,
            date VARCHAR(50) NOT NULL,
            timestamp BIGINT NOT NULL,
            INDEX idx_score (score DESC)
        )
    `);

    console.log('MySQL 데이터베이스 초기화 완료');
}

// 랭킹 조회 API
app.get('/api/rankings', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, score, date, timestamp FROM rankings ORDER BY score DESC LIMIT 10'
        );
        res.json(rows);
    } catch (error) {
        console.error('랭킹 조회 오류:', error);
        res.status(500).json({ error: '랭킹 조회 실패' });
    }
});

// 랭킹 저장 API
app.post('/api/rankings', async (req, res) => {
    try {
        const { score, date, timestamp } = req.body;

        await pool.query(
            'INSERT INTO rankings (score, date, timestamp) VALUES (?, ?, ?)',
            [score, date, timestamp]
        );

        // 상위 10개만 유지
        await pool.query(`
            DELETE FROM rankings
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM rankings ORDER BY score DESC LIMIT 10
                ) AS top_rankings
            )
        `);

        res.json({ success: true });
    } catch (error) {
        console.error('랭킹 저장 오류:', error);
        res.status(500).json({ error: '랭킹 저장 실패' });
    }
});

// 랭킹 초기화 API
app.delete('/api/rankings', async (req, res) => {
    try {
        await pool.query('DELETE FROM rankings');
        res.json({ success: true });
    } catch (error) {
        console.error('랭킹 초기화 오류:', error);
        res.status(500).json({ error: '랭킹 초기화 실패' });
    }
});

// 서버 시작
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
        console.log(`게임 URL: http://localhost:${PORT}/snake_game.html`);
    });
}).catch(err => {
    console.error('데이터베이스 초기화 실패:', err);
    process.exit(1);
});
