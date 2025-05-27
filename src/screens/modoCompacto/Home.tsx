import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faLocationDot, 
    faCalendar, 
    faFilter, 
    faFilterCircleXmark, 
    faReply, 
    faRightFromBracket, 
    faRightToBracket, 
    faUser, 
    faBook 
} from "@fortawesome/free-solid-svg-icons";

import styles from "./css/Modo_Compacto.module.css";
import { supabase } from "../../services/supabase";
import { Accesibilidad } from "../../interfaces/Accesibilidad";
import { Usuarios } from "../../interfaces/Usuarios";
import { useAuth } from "../../hooks/useAuth";
import Boton_Eventos from "./Boton_Eventos";

interface Marcador {
    id: number;
    nombre: string;
    direccion: string;
    tipoRecintoInfo: {
        id: number;
        tipo: string;
    };
    filtros: {
        nombre: string;
        tipo: string;
    }[];
}
function Modo_Compacto() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [filtroIsVisible, setFiltroIsVisible] = useState(false);
    const [filtrosActivos, setFiltrosActivos] = useState<Record<string, boolean>>({});
    const [busqueda, setBusqueda] = useState<string>("");
    
    // Estados para datos
    const [marcadores, setMarcadores] = useState<Marcador[]>([]);
    const [resultados, setResultados] = useState<Marcador[]>([]);
    const [opcionesAccesibilidad, setOpcionesAccesibilidad] = useState<Accesibilidad[]>([]);
    const [userDetails, setUserDetails] = useState<Usuarios | null>(null);
    
    // Estados para UI
    const [cargando, setCargando] = useState<boolean>(true);
    const [eventosVisible, setEventosVisible] = useState<boolean>(false);

    useEffect(() => {
        const fetchMarcadores = async () => {
            setCargando(true);
            try {
                const { data: marcadoresData, error: marcadoresError } = await supabase
                    .from('marcador')
                    .select(`
                        id,
                        nombre_recinto,
                        direccion,
                        tipo_recinto,
                        accesibilidad_marcador (
                            accesibilidad (
                                nombre,
                                tipo
                            )
                        ),
                        tipo_recinto (
                            id,
                            tipo
                        )
                    `)
                    .eq('activo', true);

                const { data: accesibilidadesData, error: accesibilidadesError } = await supabase
                    .from('accesibilidad')
                    .select('id, nombre, tipo');

                if (marcadoresError || accesibilidadesError) {
                    console.error('Error al cargar datos:', marcadoresError || accesibilidadesError);
                    return;
                }

                const marcadoresFormateados = marcadoresData.map((item: any) => ({
                    id: item.id,
                    nombre: item.nombre_recinto,
                    direccion: item.direccion,
                    tipoRecintoInfo: {
                        id: item.tipo_recinto.id,
                        tipo: item.tipo_recinto.tipo
                    },
                    filtros: item.accesibilidad_marcador.map((am: any) => ({
                        nombre: am.accesibilidad.nombre,
                        tipo: am.accesibilidad.tipo
                    }))
                }));

                const filtrosIniciales: Record<string, boolean> = {};
                accesibilidadesData.forEach((a) => {
                    filtrosIniciales[a.nombre] = false;
                });

                setMarcadores(marcadoresFormateados);
                setResultados(marcadoresFormateados);
                setFiltrosActivos(filtrosIniciales);
                setOpcionesAccesibilidad(accesibilidadesData);
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setCargando(false);
            }
        };

        fetchMarcadores();
    }, []);

    // Cargar detalles adicionales del usuario si está autenticado
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!user) {
                setUserDetails(null);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error al cargar datos de usuario:', error);
                } else {
                    setUserDetails(data);
                }
            } catch (error) {
                console.error("Error al cargar datos de usuario:", error);
            }
        };

        fetchUserDetails();
    }, [user]);

    // Filtrar resultados cuando cambia la búsqueda o los filtros
    useEffect(() => {
        const texto = busqueda.toLowerCase();
        const filtrosSeleccionados = Object.entries(filtrosActivos)
            .filter(([_, activo]) => activo)
            .map(([nombre]) => nombre);

        const filtrados = marcadores.filter((m) => {
            const coincideTexto =
                m.nombre.toLowerCase().includes(texto) ||
                m.direccion.toLowerCase().includes(texto);

            const coincideFiltro = filtrosSeleccionados.length === 0 || 
                filtrosSeleccionados.every(f => 
                    m.filtros.some(filtro => filtro.nombre === f)
                );

            return coincideTexto && coincideFiltro;
        });

        setResultados(filtrados);
    }, [busqueda, marcadores, filtrosActivos]);

    // Cambiar estado del filtro
    const toggleFiltro = (filtro: string) => {
        setFiltrosActivos(prev => ({
            ...prev,
            [filtro]: !prev[filtro]
        }));
    };

    // Función para mostrar/ocultar el componente de eventos y controlar la visibilidad de opciones
    const toggleEventos = () => {
        setEventosVisible(!eventosVisible);
        // Si se abre el panel de eventos, cerrar el panel de filtros
        if (!eventosVisible && filtroIsVisible) {
            setFiltroIsVisible(false);
        }
    };

    // Limpiar todos los filtros
    const limpiarFiltros = () => {
        const resetFiltros = {...filtrosActivos};
        Object.keys(resetFiltros).forEach(key => {
            resetFiltros[key] = false;
        });
        setFiltrosActivos(resetFiltros);
    };

    // Manejar visibilidad de filtros
    const toggleFiltros = () => {
        setFiltroIsVisible(!filtroIsVisible);
        // Si se abre el panel de filtros, cerrar el panel de eventos
        if (!filtroIsVisible && eventosVisible) {
            setEventosVisible(false);
        }
    };
    return (
        <div className={styles.container_principal}>
            {/* Botón Atrás */}
            <div style={{ marginBottom: "25px", marginRight: "10px", backgroundColor: "#000" }}>
                <button className={styles.botonatras} onClick={() => navigate(-1)}>
                    <FontAwesomeIcon style={{ fontSize: "20px", margin: "3px" }} icon={faReply} />
                    <span style={{ width: "100px", fontSize: "25px" }}>Atrás</span>
                </button>
            </div>
            
            <div className={styles.contenedor_de_opciones}>
                {/* Título principal */}
                <h3 style={{textAlign:"center",marginTop:"10px"}}>Inicio Búsqueda de Recintos</h3>
                    
                
                
                {/* Buscador */}
                <div className={styles.contenedor_buscador}>
                    <div className={styles.buscador}>
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o dirección" 
                            onChange={(e) => setBusqueda(e.target.value)} 
                            value={busqueda} 
                        />
                        <FontAwesomeIcon className={styles.icono} icon={faLocationDot} />
                    </div>
                </div>

                {/* Opciones de usuario */}
                <div className={styles.contenedor_opciones}>
                    
               
                    {/* Opción Colaborar */}
                    <div className={styles.opcion_tarjeta} onClick={() => navigate("/colaborar")}>
                        <FontAwesomeIcon className={styles.icono_opcion} icon={faBook} />
                        <button>Colaborar</button>
                    </div>

                    {/* Opción Mi Perfil o Iniciar Sesión */}
                    {user ? (
                        <div className={styles.opcion_tarjeta} onClick={() => navigate(`/usuario/perfil/${user.id}`)}>
                            <FontAwesomeIcon className={styles.icono_opcion} icon={faUser} />
                            <button>Mi Perfil</button>
                        </div>
                    ) : (
                        <div className={styles.opcion_tarjeta} onClick={() => navigate("/login")}>
                            <FontAwesomeIcon className={styles.icono_opcion} icon={faRightToBracket} />
                            <button>Iniciar Sesión</button>
                        </div>
                    )}

                    {/* Opción Salir */}
                    <div className={styles.opcion_tarjeta} onClick={() => navigate("/")}>
                        <FontAwesomeIcon className={styles.icono_opcion} icon={faRightFromBracket} />
                        <button>Salir</button>
                    </div>
                </div>
               

                {/* Botones de eventos y filtros */}
                <div className={styles.contenedor_botones}>
                    <div className={styles.contenedor_eventos}>
                        <div className={styles.eventos}>
                            <button onClick={toggleEventos}>
                                {eventosVisible ? "Ocultar Eventos" : "Listado De Eventos"}
                            </button>
                            <FontAwesomeIcon className={styles.icono_evento} icon={faCalendar} onClick={toggleEventos} />
                        </div>
                    </div>
                    <div className={styles.contenedor_filtros}>
                        <div className={styles.filtros}>
                            <button onClick={toggleFiltros}>
                                {filtroIsVisible ? "Ocultar Filtros" : "Filtrar Resultados"}
                            </button>
                            <FontAwesomeIcon 
                                className={styles.icono_filtro} 
                                icon={filtroIsVisible ? faFilterCircleXmark : faFilter} 
                                onClick={toggleFiltros}
                            />
                        </div>
                    </div>
                </div>

                {/* Panel de eventos */}
                {eventosVisible && (
                    <div className={styles.contenedor_resultados_eventos}>
                        <Boton_Eventos />
                    </div>
                )}

                {/* Panel de filtros */}
                {filtroIsVisible && (
                    <div className={styles.contenedor_resultados_filtros}>
                        <p>Filtros de Accesibilidad</p>
                        
                        {opcionesAccesibilidad.map((acces) => (
                            <div key={acces.id}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={filtrosActivos[acces.nombre] || false}
                                        onChange={() => toggleFiltro(acces.nombre)}
                                    />{" "}
                                    {acces.nombre}
                                </label>
                            </div>
                        ))}
                        
                        {Object.values(filtrosActivos).some(Boolean) && (
                            <button 
                                onClick={limpiarFiltros}
                                style={{
                                    marginTop: '10px',
                                    padding: '5px 10px',
                                    backgroundColor: '#000',
                                    border: '1px solid #ccc',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    color: "yellow",
                                }}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}

                

                {/* Resultados de búsqueda */}
                {!eventosVisible && (
                    <div className={styles.resultados_busqueda}>
                        <div className={styles.contenedor_titulo}>
                            <h4 style={{textAlign:"center"}}>Resultados {resultados.length > 0 && `(${resultados.length})`}</h4> 
                            <h4 style={{textAlign:"center",fontSize:"1.3rem"}}>{user ? `Bienvenido, ${userDetails?.nombre || user.user_metadata?.nombre || user.email}` : 'Bienvenido'}</h4>
        
                        </div>

                        <div className={styles.contenedor_resultados}>
                            {cargando ? (
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <p>Cargando recintos...</p>
                                </div>
                            ) : resultados.length > 0 ? (
                                resultados.map((marcador) => (
                                    <div 
                                        key={marcador.id} 
                                        className={styles.marcador} 
                                    >
                                        <h3>{marcador.nombre}</h3>
                                        <p><strong>Tipo:</strong> {marcador.tipoRecintoInfo.tipo}</p>
                                        <p><strong>Dirección:</strong> {marcador.direccion}</p>
                                        
                                        <div className={styles.accesibilidad_marcador}>
                                            <h3>Accesibilidades:</h3>
                                            
                                            {marcador.filtros.length === 0 ? (
                                                <p>Este recinto no cuenta con Accesibilidad Universal aún</p>
                                            ) : (
                                                <ul>
                                                    {marcador.filtros.map((filtro, index) => (
                                                        <li key={index}>{filtro.tipo}: {filtro.nombre}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            
                                            <div style={{display: "flex", justifyContent: "flex-end", alignItems: "flex-end", margin: "15px"}}>
                                                <button onClick={() => navigate(`/modocompacto/trazadoruta/${marcador.id}`)}>
                                                    Iniciar Navegación
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <p>No se encontraron resultados para tu búsqueda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modo_Compacto;