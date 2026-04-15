import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import useFirestoreSync from './useFirestoreSync';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para Sonex - Asistente virtual Sonepar
 * Gestiona historial de chat y configuraciones de sesión
 */
export function useSonex() {
  const { user } = useAuth();
  
  // Sync para historial de chat
  const { data: historialData, saveData: saveHistorial, syncStatus: chatSync } = useFirestoreSync(
    'sonex',
    'history',
    [],
    'sonepar_sonex_historial'
  );

  // Estados locales
  const [messages, setMessages] = useState(historialData || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [modoActivo, setModoActivo] = useState("busqueda");
  const [contextoActivo, setContextoActivo] = useState("");
  const [refsTurno, setRefsTurno] = useState([]);
  
  const messagesEndRef = useRef(null);

  // Normalizar timestamps al cargar mensajes desde Firestore
  const normalizarMensajes = (msgs) => {
    if (!Array.isArray(msgs)) return [];
    return msgs.map(m => ({
      ...m,
      timestamp: m.timestamp instanceof Date 
        ? m.timestamp 
        : (m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp?.seconds ? m.timestamp.seconds * 1000 : Date.now()))
    }));
  };

  // Actualizar mensajes cuando cambian los datos sincronizados
  useEffect(() => {
    if (historialData) {
      const normalizados = normalizarMensajes(historialData);
      setMessages(normalizados);
    }
  }, [historialData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const guardarMensaje = useCallback((nuevoMensaje) => {
    const msgNormalizado = {
      ...nuevoMensaje,
      timestamp: nuevoMensaje.timestamp instanceof Date 
        ? nuevoMensaje.timestamp 
        : new Date()
    };
    const nuevoHistorial = [...messages, msgNormalizado].slice(-100);
    setMessages(nuevoHistorial);
    saveHistorial(nuevoHistorial);
  }, [messages, saveHistorial]);

  const limpiarChat = () => {
    setMessages([]);
    saveHistorial([]);
  };

  const exportarChat = () => {
    const texto = messages.map(m => 
      `[${m.timestamp.toLocaleTimeString()}] ${m.role === 'user' ? 'Tú' : 'SONEX'}: ${m.content}`
    ).join('\n');
    return texto;
  };

  // Cargar sugerencias populares globales
  const [sugerenciasPopulares, setSugerenciasPopulares] = useState([]);
  const [loadingSugerencias, setLoadingSugerencias] = useState(true);

  useEffect(() => {
    async function fetchPopularSearches() {
      try {
        const docRef = doc(db, 'global', 'popularSearches');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const searches = snap.data().searches || {};
          const topSearches = Object.entries(searches)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([query]) => query.charAt(0).toUpperCase() + query.slice(1));
          setSugerenciasPopulares(topSearches);
        }
      } catch (e) {
        console.warn('Error cargando búsquedas populares:', e);
      } finally {
        setLoadingSugerencias(false);
      }
    }
    fetchPopularSearches();
  }, []);

  return {
    // Estados
    messages, setMessages,
    input, setInput,
    isLoading, setIsLoading,
    categoriaActiva, setCategoriaActiva,
    modoActivo, setModoActivo,
    contextoActivo, setContextoActivo,
    refsTurno, setRefsTurno,
    sugerenciasPopulares,
    loadingSugerencias,

    // Refs
    messagesEndRef,

    // Acciones
    guardarMensaje,
    limpiarChat,
    exportarChat,
    scrollToBottom,

    // Sync status
    syncStatus: chatSync,
  };
}
