import { io } from "socket.io-client";

/**
 * Script de prueba para validar la funcionalidad de WebSockets desde la perspectiva del Pasajero.
 * 
 * Este script simula el comportamiento de la aplicación del pasajero para:
 * 1. Establecer una conexión persistente con el servidor de Socket.io.
 * 2. Autenticar la sesión utilizando un token JWT de pasajero.
 * 3. Unirse al room del viaje específico para recibir actualizaciones en tiempo real ('trip-update').
 */

const PASSENGER_TOKEN = ""; //poner el token obtenido desde postman
const TRIP_ID = ""; //poner el id del viaje obtenido desde postman

const socket = io("http://localhost:3000", {
    auth: { token: PASSENGER_TOKEN },
});

socket.on("connect", () => {
    console.log("✅ Listener conectado:", socket.id);

    // Esperamos 1s para asegurar que el backend termine el handleConnection
    setTimeout(() => {
        // se une al room del trip
        socket.emit("join-trip", { tripId: TRIP_ID }, (ack) => {
            console.log("📌 join-trip ACK:", ack);
        });
    }, 1000);
});

socket.on("trip-update", (data) => {
    console.log("📩 trip-update recibido:", data.status, data.currentLocation);
});

socket.on("connect_error", (err) => {
    console.error("🚨 connect_error:", err.message);
});

socket.on("disconnect", (reason) => {
    console.log("❌ disconnected:", reason);
});