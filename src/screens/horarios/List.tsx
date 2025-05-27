import styles from "./css/List.module.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faFilter, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Tipo_Recinto } from "../../interfaces/Tipo_Recinto";
import { Marcador } from '../../interfaces/Marcador';
import { useNavigate } from 'react-router-dom'
import NavbarAdmin from "../../components/NavbarAdmin";

function ListHorarioMarcador() {
  const [isActiveBuscador, setIsActiveBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [Tipo_Ubicacion_Seleccionado, setTipo_Ubicacion_Seleccionado] = useState('');
  const [tipoRecinto, setTipoRecinto] = useState<Tipo_Recinto[]>();
  const [Gestion_resenas, Set_Resenas] = useState<Marcador[]>([]);

  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const { data: tipoRecintoData, error: tipoRecintoError } = await supabase
        .from('tipo_recinto')
        .select('*');

      const { data: gestionResenasData, error: gestionResenasError } = await supabase
        .from('marcador')
        .select(`
          *,
          tipo_recinto:tipo_recinto (
            tipo
          )
        `);

      if (tipoRecintoError || gestionResenasError) {
        console.error('Error al obtener datos:', tipoRecintoError || gestionResenasError);
      } else {
        setTipoRecinto(tipoRecintoData || []);
        Set_Resenas(gestionResenasData || []);
      }
    };

    fetchData();
  }, []);

  function handleBuscador() {
    setIsActiveBuscador(prev => !prev);
  }

  function handleBusquedaChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBusqueda(e.target.value);
  }
  const Edificio = Gestion_resenas.filter((recinto) => {
    const nombre = recinto.nombre_recinto.toLowerCase();
    const tipo = (recinto.tipo_recinto as any)?.tipo.toLowerCase();
    const textoBusqueda = busqueda.toLowerCase();
    const coincideBusqueda = nombre.includes(textoBusqueda) || tipo.includes(textoBusqueda);
    const coincideTipo =
      Tipo_Ubicacion_Seleccionado === '' ||
      tipo === Tipo_Ubicacion_Seleccionado.toLowerCase();
    return coincideBusqueda && coincideTipo;
  });


  return (
    <>
      <NavbarAdmin />
      <div className={styles.container}>



        <header className={styles.header} style={{ paddingTop: '40px', gap: '15px' }}>
          <hr style={{ flexGrow: "1" }} />
          <h2 style={{ textAlign: 'right', paddingRight: "15px", whiteSpace: "nowrap" }}>Gestión de horarios de marcadores</h2>
        </header>

        <div className={styles.filtros}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button className={styles.filtroCard} onClick={handleBuscador}>
              <FontAwesomeIcon icon={faMagnifyingGlass} /> Buscador
            </button>

            <div className={styles.filtroCard}>
              <label>
                <FontAwesomeIcon icon={faFilter} />
              </label>
              <select value={Tipo_Ubicacion_Seleccionado} onChange={e => setTipo_Ubicacion_Seleccionado(e.target.value)}
                style={{
                  width: '100px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                <option value="">Todos</option>
                {tipoRecinto?.map((tipo) => (
                  <option key={tipo.id} value={tipo.tipo}>
                    {tipo.tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isActiveBuscador && (
            <div className={styles.buscar}>
              <form onSubmit={e => e.preventDefault()}>
                <input type="text" placeholder="Buscar" value={busqueda} onChange={handleBusquedaChange} />
                <button type="submit">
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
              </form>
            </div>
          )}
        </div>


        <div className={styles.SubTitulo}>
          <p>Listado de marcadores</p>
          <hr style={{ width: '25%', marginTop: '10px', marginBottom: '10px', opacity: '50%' }} />
        </div>
        <div className={styles.content}>
          {Edificio.map((locacion: { id: number, nombre_recinto: string; direccion: string; tipo_recinto: string; }, index: number) => (
            <div className={styles.card} key={index} onClick={() => { navigate(`/panel-administrativo/marcadores/horario/${locacion.id}`) }}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.estado} style={{ backgroundColor: '#0397fc' }}>
                <FontAwesomeIcon icon={faBuilding} size="xl" style={{ color: 'white' }} />
              </div>

              <div className={styles.cardContent}  >
                <p style={{ color: 'gray', fontSize: '0.7rem', textTransform: 'capitalize' }}>{(locacion.tipo_recinto as any)?.tipo}</p>

                <p style={{ color: 'black' }}>{locacion.nombre_recinto || "Cargando..."}</p>
                <p style={{ color: 'gray', fontSize: '0.9rem' }}>{locacion.direccion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>

  );
}

export default ListHorarioMarcador;