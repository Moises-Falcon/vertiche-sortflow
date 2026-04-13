const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const lecturasRouter = require('./routes/lecturas');
const tagsRouter = require('./routes/tags');
const cajasRouter = require('./routes/cajas');
const anomaliasRouter = require('./routes/anomalias');
const trazabilidadRouter = require('./routes/trazabilidad');
const dashboardRouter = require('./routes/dashboard');
const proveedoresRouter = require('./routes/proveedores');
const pedidosRouter = require('./routes/pedidos');
const paletsRouter = require('./routes/palets');
const tiendasRouter = require('./routes/tiendas');
const ordenesRouter = require('./routes/ordenes');
const { initSocket } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Pasar io a todas las routes via middleware
app.use((req, res, next) => { req.io = io; next(); });

app.use('/api/lecturas', lecturasRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/cajas', cajasRouter);
app.use('/api/anomalias', anomaliasRouter);
app.use('/api/trazabilidad', trazabilidadRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/palets', paletsRouter);
app.use('/api/tiendas', tiendasRouter);
app.use('/api/ordenes', ordenesRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

initSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Backend RFID corriendo en puerto ${PORT}`));
