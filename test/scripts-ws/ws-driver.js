import { io } from "socket.io-client";
/**
 * Script de prueba para validar la funcionalidad de WebSockets desde la perspectiva del Conductor.
 * 
 * Este script simula el comportamiento de la aplicación del conductor para:
 * 1. Establecer una conexión persistente con el servidor de Socket.io.
 * 2. Autenticar la sesión utilizando un token JWT de conductor.
 * 3. Emitir actualizaciones de ubicación en tiempo real ('update-location') vinculadas a un viaje específico.
 */


const DRIVER_TOKEN = ""; //poner el token obtenido desde postman
const TRIP_ID = ""; //poner el id del viaje obtenido desde postman

const socket = io("http://localhost:3000", {
    auth: { token: DRIVER_TOKEN },
});

socket.on("connect", () => {
    console.log("✅ Driver conectado:", socket.id);

    // Esperamos 1s para asegurar que el backend termine el handleConnection (async) y guarde el user
    setTimeout(() => {
        // Emitimos un update-location
        socket.emit(
            "update-location",
            {
                tripId: TRIP_ID,
                location: "Av. Italia 1234",
                status: "IN_PROGRESS",
            },
            (ack) => {
                console.log("📌 update-location ACK:", ack?.status, ack?.currentLocation);
            }
        );
    }, 1000);
});

socket.on("connect_error", (err) => {
    console.error("🚨 connect_error:", err.message);
});

socket.on("disconnect", (reason) => {
    console.log("❌ disconnected:", reason);
});
