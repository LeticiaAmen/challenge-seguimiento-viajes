# Seguimiento de Viajes (Challenge NestJS)

Backend para una aplicación de seguimiento de viajes en tiempo real (tipo Uber/Cabify).
Implementado con **NestJS**, **MongoDB** (Mongoose), **Firebase Auth** y **Socket.io**.

## 1. Tecnologías

- **Framework**: NestJS
- **Base de Datos**: MongoDB Atlas (vía Mongoose)
- **Autenticación**: Firebase Auth (JWT ID Tokens) + Sync Pattern
- **Tiempo Real**: Socket.io (WebSockets)

---

## 2. Requisitos Previos

- **Node.js**: v18 o superior.
- **npm**: v9 o superior.
- **MongoDB Atlas**: Un cluster creado y la URI de conexión.
- **Firebase Project**: Un proyecto en Firebase Console con "Authentication" habilitado (proveedor Email/Password).

---

## 3. Setup e Instalación

### 3.1 Instalar dependencias

```bash
npm install
```

### 3.2 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env
```

Configura las variables:

| Variable | Descripción |
|----------|-------------|
| `MONGO_URI` | String de conexión a MongoDB Atlas. |
| `FIREBASE_PROJECT_ID` | ID de tu proyecto Firebase (ej: `trips-tracker`). |
| `DRIVER_UIDS` | Lista de UIDs de Firebase separados por coma que tendrán rol de **Conductor**. |

## 4. Ejecutar el Proyecto

```bash
# Modo desarrollo (watch)
npm run start:dev
```

El servidor iniciará en: `http://localhost:3000`

---

## 5. Obtener Token de Prueba (Firebase)

Para probar los endpoints, necesitas un ID Token válido. Puedes obtenerlo usando la API REST de Google Identity Toolkit:

**Método:** `POST`
**URL:** `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[TU_FIREBASE_API_KEY]`

**Body:**
```json
{
  "email": "driver@test.com",
  "password": "tu_password",
  "returnSecureToken": true
}
```

Usa el campo `idToken` de la respuesta como **Bearer Token** en tus requests.
*Nota: El token expira en 1 hora.*

---

## 6. API REST

Todos los endpoints protegidos requieren header: `Authorization: Bearer <ID_TOKEN>`

### 6.1 Crear Viaje (Pasajero)
**POST** `/trips`
- **Rol requerido**: Passenger (cualquier usuario NO listado en `DRIVER_UIDS`).

**Body:**
```json
{
  "destination": "Av. Italia 1234"
}
```

**Respuestas:**
- `201 Created`: Viaje creado (status `REQUESTED`).
- `401 Unauthorized`: Token faltante o inválido.
- `403 Forbidden`: Si el usuario es Conductor.

### 6.2 Listar Viajes Activos (Conductor)
**GET** `/trips/active`
- **Rol requerido**: Driver (UID debe estar en `DRIVER_UIDS`).

**Respuestas:**
- `200 OK`: Array de viajes en estado `REQUESTED`.
- `403 Forbidden`: Si el usuario es Pasajero.

---

## 7. WebSockets (Socket.io)

Conexión base: `http://localhost:3000`
Transport: `polling` -> `websocket` (o solo websocket).

### 7.1 Autenticación (Handshake)
Debes enviar el token en el objeto `auth` al conectar.

```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "TU_FIREBASE_ID_TOKEN" }
});
```

Si no hay token o es inválido, el servidor desconectará al cliente.

### 7.2 Unirse a un Viaje (Join Room)
Para recibir actualizaciones de un viaje específico.
- **Evento**: `join-trip`
- **Payload**: `{ "tripId": "64b..." }`
- **Respuesta (Ack)**: `{ ok: true, room: "trip:64b..." }`

### 7.3 Actualizar Ubicación (Solo Driver)
Solo usuarios con rol Driver pueden emitir update-location.
Los Passenger recibirán error WS (Forbidden) si lo intentan.

- **Evento**: `update-location`
- **Payload**: 
  ```json
  {
    "tripId": "64b...",
    "location": "Lat: -34.12, Long: -56.12",
    "status": "IN_PROGRESS" 
  }
  ```
- **Estados permitidos**: `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`.

### 7.4 Escuchar Actualizaciones
El servidor emitirá este evento a todos en la sala del viaje.
- **Evento**: `trip-update`
- **Payload**: Objeto Trip completo actualizado (con pasajero poblado).

---

## 8. Snippet de Prueba (Cliente JS)

Código mínimo para probar desde un script de Node.js o consola del navegador:

```javascript
import { io } from "socket.io-client";

const TOKEN = "TU_TOKEN_AQUI";
const TRIP_ID = "ID_DEL_VIAJE";

const socket = io("http://localhost:3000", {
    auth: { token: TOKEN }
});

socket.on("connect", () => {
    console.log("Conectado:", socket.id);
    
    // Unirse para escuchar
    socket.emit("join-trip", { tripId: TRIP_ID }, (ack) => {
        console.log("Unido a sala:", ack);
    });
});

socket.on("trip-update", (data) => {
    console.log("Actualización recibida:", data);
});

// Solo si eres Driver:
// socket.emit("update-location", { tripId: TRIP_ID, location: "Calle Falsa 123", status: "IN_PROGRESS" });
```

---

## 9. Configuración de Roles

El sistema define roles de forma determinística vía variables de entorno.
- **Driver**: Si el `firebaseUid` del usuario está en la lista `DRIVER_UIDS` del `.env`.
- **Passenger**: Cualquier otro usuario autenticado válidamente.

Para convertir un usuario en conductor:
1. Obtén su UID desde Firebase Console.
2. Agrégalo a `DRIVER_UIDS` en el `.env`.
3. Reinicia el servidor.

---

## 10. Troubleshooting

- **Error 401 Unauthorized**:
  - Revisa que `FIREBASE_PROJECT_ID` coincida con el del token.
  - El token puede haber expirado (duran 1h). Regeneralo.
- **Error 403 Forbidden**:
  - Estás intentando una acción de Driver con un usuario Passenger (o viceversa). Revisa `DRIVER_UIDS`.
- **WS conecta pero no recibo eventos**:
  - Asegúrate de haber emitido `join-trip` exitosamente.
  - Verifica que el `tripId` sea correcto y exista en la BD.
- **MongoDB connection error**:
  - Revisa que tu IP esté permitida en la "Network Access" de MongoDB Atlas.
