import styles from './css/InfoDetallada.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect } from 'react';
import { faReply } from '@fortawesome/free-solid-svg-icons';
import { Marcador } from '../../interfaces/Marcador';
import { Accesibilidad } from '../../interfaces/Accesibilidad';
import { supabase } from '../../services/supabase';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import ImagenConFallback from '../../components/ImagenConFallback';
import { useAuth } from '../../hooks/useAuth';
import Marca_Verificador from '../../../public/img/Marca_Verificador.webp';
import { Horarios } from '../../interfaces/Horarios';

interface TipoDeAccesibilidades {
    [tipo: string]: Accesibilidad[];
}

export default function InfoDetallada() {
    const navigate = useNavigate()
    const { id } = useParams();
    const { user, userRole } = useAuth();
    const [accesibilidades, setAccesibilidades] = useState<TipoDeAccesibilidades>({});
    const [nombreTipoRecinto, setNombreTipoRecinto] = useState('');
    const [marcadorPropio, setMarcadorPropio] = useState(false);

    const [horario, setHorario] = useState<Horarios[]>([]);

    const [dataMarcador, setDataMarcador] = useState<Partial<Marcador>>({
        nombre_recinto: '',
        tipo_recinto: '',
        direccion: '',
        pagina_web: '',
        telefono: '',
        id_usuario: undefined,
        id_solicitud: undefined,
        url_img: '',
        latitud: undefined,
        longitud: undefined,
        activo: true,
        accesibilidad_certificada: false,
        info_adicional: ''

    });
    const [selecciones, setSelecciones] = useState<number[]>([]);
    const [supervisor, setSupervisor] = useState({
        id: undefined,
        nombre: ''
    });

    useEffect(() => { // LLAMADO A LA API PARA OBTNER TODOAS LAS ACCESIBILIDADES QUE HAY EN LA BASE DE DATOS Y LA CLASIFICA POR TIPO
        const fetchAccesibilidades = async () => {
            const { data, error } = await supabase.from('accesibilidad').select('*');
            if (error) console.error('Error al obtener accesibilidades:', error);
            else {
                const agrupadas: TipoDeAccesibilidades = {};
                data.forEach((acc: Accesibilidad) => {
                    if (!agrupadas[acc.tipo]) agrupadas[acc.tipo] = [];
                    agrupadas[acc.tipo].push(acc);
                });
                setAccesibilidades(agrupadas);
            }
        };

        fetchAccesibilidades();
    }, []);

    useEffect(() => {
        const fetchMarcador = async () => {
            const { data, error } = await supabase
                .from('marcador')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error al obtener el marcador:', error);
            } else {
                setDataMarcador(data);

                const { data: relaciones, error: errorRelaciones } = await supabase
                    .from('accesibilidad_marcador')
                    .select('id_accesibilidad')
                    .eq('id_marcador', id);

                if (errorRelaciones) {
                    console.error('Error al obtener relaciones de accesibilidad:', errorRelaciones);
                } else {
                    const ids = relaciones.map((r) => r.id_accesibilidad);
                    setSelecciones(ids);
                }
            }
        };

        if (id) {
            fetchMarcador();
        }
    }, [id]);


    useEffect(() => {
        const fetchNombreUsuario = async () => {
            if (!dataMarcador.id_usuario) return;

            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nombre')
                .eq('id', dataMarcador.id_usuario)
                .single();

            if (error) {
                console.error('Error al obtener el nombre del usuario:', error);
            } else {
                setSupervisor(data);
            }
        };

        fetchNombreUsuario();
    }, [dataMarcador.id_usuario]);

    useEffect(() => {
        const fetchTipoRecinto = async () => {
            if (!dataMarcador.tipo_recinto) return;

            const { data, error } = await supabase
                .from('tipo_recinto')
                .select('tipo')
                .eq('id', dataMarcador.tipo_recinto)
                .single();

            if (error) {
                console.error('Error al obtener el tipo de recinto:', error);
            } else {
                setNombreTipoRecinto(data.tipo);
            }
        };

        fetchTipoRecinto();
    }, [dataMarcador.tipo_recinto]);


    const toggleActivo = async () => {
        if (!id) return;

        const nuevoEstado = !dataMarcador.activo;

        const { error } = await supabase
            .from('marcador')
            .update({ activo: nuevoEstado })
            .eq('id', id);

        if (error) {
            console.error('Error al cambiar el estado de activo:', error);
        } else {
            setDataMarcador(prev => ({ ...prev, activo: nuevoEstado }));
            alert(`Marcador ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
        }

        const fechaHoraActual = new Date().toISOString();

        const Registro_cambios = async () => {
            const tipoAccion = nuevoEstado ? 'Activación de Marcador' : 'Desactivación de Marcador';
            const detalleAccion = nuevoEstado
                ? `Se activó el marcador con ID ${id}`
                : `Se desactivó el marcador con ID ${id}`;

            const { data: registro_logs, error: errorLog } = await supabase
                .from('registro_logs')
                .insert([
                    {
                        id_usuario: user?.id,
                        tipo_accion: tipoAccion,
                        detalle: detalleAccion,
                        fecha_hora: fechaHoraActual,
                    }
                ]);

            if (errorLog) {
                console.error('Error al registrar en los logs:', errorLog);
                return;
            }

            console.log('Registro insertado en registro_logs correctamente', registro_logs);
        };

        Registro_cambios();
    };

    useEffect(() => {
        if (!id) return;

        const fetchHorario = async () => {
            const { data, error } = await supabase
                .from('horarios')
                .select('*')
                .eq('id_marcador', id);

            if (error) {
                console.error('Error al obtener el horario:', error);
                return;
            }

            if (data) {
                setHorario(data);
            }
        };

        fetchHorario();
    }, [id]);



    // Verificar si el usuario es el dueño del marcador o tiene rol de administrador o gestor para permitir la edición
    useEffect(() => {
        if (!dataMarcador || !user) return;

        const esDueño = String(dataMarcador.id_usuario) === String(user.id);
        const esAdminOGestor = userRole === 'administrador' || userRole === 'gestor';

        if (esDueño || esAdminOGestor) {
            setMarcadorPropio(true); // Permitir edición
        } else {
            setMarcadorPropio(false)
        }
    }, [dataMarcador, user, userRole]);


    return (
        <div className={styles.container}>
            <div className={styles.header}>

                <ImagenConFallback
                    src={dataMarcador?.url_img}
                    alt="Imagen del recinto"
                    className={styles.imagenMarcador}
                />

                <button style={{ zIndex: 10 }} className={styles.VolverAtras} onClick={() => { navigate(-1) }}>
                    <FontAwesomeIcon icon={faReply} size='2xl' />
                </button>
                <div className={styles.Titulo} >
                    <h2>Información detallada</h2>
                </div>
                <div className={styles.locacionTitulo}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        <h4>{dataMarcador.nombre_recinto}</h4>
                        {dataMarcador.accesibilidad_certificada ? (
                            <img className={styles.marcaVerificador} src={Marca_Verificador} alt="Marca Verificador" title='Marcador Verificado' />
                        ) : (
                            <p></p>
                        )}
                    </div>
                    <p>{'>'} {nombreTipoRecinto}</p>

                </div>
            </div>

            <div className={styles.Conten}>
                <div className={styles.FormContainer}>
                    <div className={styles.formGrid}>
                        {/*Primer Grupo*/}
                        <div className={styles.formSection} >
                            <label htmlFor="">¿Está activo? {dataMarcador.activo ? (<p>Si</p>) : (<p>No</p>)}</label>
                            <label className={styles.labelSeccion} >Solicitud</label>
                            {dataMarcador.id_solicitud == null ? (
                                <p>No se ingresó registro.</p>
                            ) : (
                                <p>{dataMarcador.id_solicitud}
                                    <button className={styles.btnLink} >
                                        <FontAwesomeIcon onClick={() => { navigate(`/panel-administrativo/solicitud/${dataMarcador.id_solicitud}`) }} size="sm" icon={faArrowUpRightFromSquare} />

                                    </button>
                                </p>
                            )}

                            <label className={styles.labelSeccion} >Supervisor</label>
                            {supervisor.id === undefined ? (
                                <p>No se ingresó registro.</p>
                            ) : (
                                <p>{supervisor.nombre}
                                    <button className={styles.btnLink} >
                                        <FontAwesomeIcon onClick={() => { navigate(`/usuario/perfil/${supervisor.id}`) }} size="sm" icon={faArrowUpRightFromSquare} />

                                    </button>
                                </p>
                            )}


                            <label className={styles.labelSeccion} >Nombre locación</label>
                            <p>{dataMarcador.nombre_recinto}</p>
                            <label className={styles.labelSeccion}>Tipo de recinto</label>
                            <p>{nombreTipoRecinto}</p>
                            <label className={styles.labelSeccion} htmlFor="">Dirección</label>
                            <p>{dataMarcador.direccion}</p>
                            <label className={styles.labelSeccion} htmlFor="">Página web</label>
                            <p>{dataMarcador.pagina_web}</p>
                            <label className={styles.labelSeccion} htmlFor="">Teléfono</label>
                            <div className={styles.ContainerinputTelefono}>
                                <p className={styles.codTelfono}>+569</p>
                                <p>{dataMarcador.telefono}</p>
                            </div>

                            <button onClick={() => { navigate(`/panel-administrativo/marcadores/horario/${id}`) }} style={{ textDecoration: 'underline',  background: 'none', width: 'fit-content', border: 'none' }}> <label className={styles.labelSeccion} style={{cursor: 'pointer',}} htmlFor="">Horario <FontAwesomeIcon icon={faArrowUpRightFromSquare} size='2xs' /></label></button>
                            <div className={styles.ContainerinputTelefono}>
                                <ul>
                                    {horario
                                        .slice() // para no mutar el estado original
                                        .sort((a, b) => {
                                            const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                                            return ordenDias.indexOf(a.dia) - ordenDias.indexOf(b.dia);
                                        })
                                        .map((h) => (
                                            <li style={{ listStyleType: 'none', marginTop: '5px' }}>
                                                {h.dia} - {h.apertura} a {h.cierre}
                                            </li>
                                        ))}
                                    {horario.length === 0 && <p>No se ingresó horario. </p>}



                                </ul>
                            </div>
                        </div>

                        {/*Segundo Grupo*/}
                        <div className={styles.gridContainer}>
                            {Object.entries(accesibilidades).map(([tipo, lista]) => {
                                const seleccionadas = lista.filter(acc => selecciones.includes(acc.id));
                                if (seleccionadas.length === 0) return null;

                                return (
                                    <div key={tipo} className={styles.accesibilidadGrupo}>
                                        <p><strong>{`Accesibilidad ${tipo}`}</strong></p>
                                        {seleccionadas.map(acc => (
                                            <div className={styles.opt} key={acc.id}>
                                                <input
                                                    type="checkbox"
                                                    value={acc.id}
                                                    checked={true}
                                                    disabled={true} // <--- Esto evita que se pueda editar
                                                    id={acc.nombre}
                                                />
                                                <label htmlFor={acc.nombre}>{acc.nombre}</label>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}

                            <div>
                                <label className={styles.labelSeccion} htmlFor="">Informacion Adicional</label>
                                <p style={{ color: '#ccc' }}>{dataMarcador.info_adicional || 'No aporta informacion adicional.'}</p>

                            </div>


                        </div>

                    </div>

                    {marcadorPropio ? (
                        <div className={styles.acciones}>
                            <button
                                type="button"
                                onClick={toggleActivo}
                                style={{ color: dataMarcador.activo ? 'red' : 'green', backgroundColor: 'transparent' }}
                            >
                                {dataMarcador.activo ? 'Desactivar' : 'Activar'}
                            </button>
                            <button type="submit" onClick={() => { navigate(`/panel-administrativo/marcadores/editar/${dataMarcador.id}`) }}>Editar</button>
                        </div>
                    ) : (
                        <p>No tienes permiso para editar este marcador.</p>
                    )}

                </div>
            </div>



        </div >
    )

}