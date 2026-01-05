const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// PostgreSQL 연결 설정
const dbConfig = {
    host: 'localhost',
    user: 'postgres',
    password: 'asdf1234',  // PostgreSQL 비밀번호 입력
    database: 'snake_game',
    port: 5432
};

let pool;

// 데이터베이스 초기화
async function initDatabase() {
    // 먼저 기본 데이터베이스에 연결하여 snake_game 데이터베이스 생성
    const initPool = new Pool({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: 'postgres',
        port: dbConfig.port
    });

    try {
        // 데이터베이스 존재 여부 확인
        const dbCheck = await initPool.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbConfig.database]
        );

        if (dbCheck.rows.length === 0) {
            await initPool.query(`CREATE DATABASE ${dbConfig.database}`);
            console.log('데이터베이스 생성 완료');
        }
    } catch (error) {
        // 데이터베이스가 이미 존재할 수 있음
        console.log('데이터베이스 확인:', error.message);
    } finally {
        await initPool.end();
    }

    // 실제 데이터베이스에 연결
    pool = new Pool(dbConfig);

    // 테이블 생성
    await pool.query(`
        CREATE TABLE IF NOT EXISTS rankings (
            id SERIAL PRIMARY KEY,
            score INT NOT NULL,
            date VARCHAR(50) NOT NULL,
            timestamp BIGINT NOT NULL
        )
    `);

    // 인덱스 생성 (없으면)
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_score ON rankings (score DESC)
    `);

    console.log('PostgreSQL 데이터베이스 초기화 완료');
}

// 랭킹 조회 API
app.get('/api/rankings', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, score, date, timestamp FROM rankings ORDER BY score DESC LIMIT 10'
        );
        res.json(result.rows);
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
            'INSERT INTO rankings (score, date, timestamp) VALUES ($1, $2, $3)',
            [score, date, timestamp]
        );

        // 상위 10개만 유지
        await pool.query(`
            DELETE FROM rankings
            WHERE id NOT IN (
                SELECT id FROM rankings ORDER BY score DESC LIMIT 10
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
