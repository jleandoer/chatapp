# 💬 chatapp

JitCall es una aplicación de mensajería moderna construida con **Angular + Ionic**, que permite enviar mensajes de texto, voz, imágenes, videos, documentos y ubicación. También permite realizar **videollamadas** usando **Jitsi Meet** y almacenar archivos en **Supabase**. Utiliza **Firebase** para la autenticación, mensajes en tiempo real y notificaciones push.

## 🚀 Características

- Mensajes en tiempo real con Firestore
- Notificaciones push con FCM
- Videollamadas vía Jitsi Meet
- Multimedia: imágenes, videos, audios y documentos
- Ubicación: envío de ubicación con vista previa en Mapbox
- Sistema de contactos personalizado
- Almacenamiento de archivos con Supabase (bucket único estructurado)

## Tecnologías

| Tecnología       | Descripción |
| Angular + Ionic  | Framework principal (frontend y móvil) |
| Firebase         | Autenticación, Firestore, FCM |
| Supabase         | Almacenamiento de archivos (bucket `chat-files`) |
| Mapbox GL JS     | Renderizado de mapas para ubicación |
| Jitsi Meet       | Videollamadas (vía servidor público) |
| Capacitor        | Acceso nativo a cámara, micrófono, geolocalización, etc. |


## Instalacion

git clone https://github.com/jleandoer/chatapp.git
cd chatapp

npm install

