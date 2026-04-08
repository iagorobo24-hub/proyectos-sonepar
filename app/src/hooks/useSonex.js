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

  // Actualizar mensajes cuando cambian los datos sincronizados
  useEffect(() => {
    if (historialData) setMessages(historialData);
  }, [historialData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const guardarMensaje = useCallback((nuevoMensaje) => {
    const nuevoHistorial = [...messages, nuevoMensaje].slice(-100);
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

  return {
    // Estados
    messages, setMessages,
    input, setInput,
    isLoading, setIsLoading,
    categoriaActiva, setCategoriaActiva,
    modoActivo, setModoActivo,
    contextoActivo, setContextoActivo,
    refsTurno, setRefsTurno,
    
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
