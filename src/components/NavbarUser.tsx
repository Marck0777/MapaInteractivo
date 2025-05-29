import { useAuth } from "../hooks/useAuth"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import styles from './css/NavbarUser.module.css'
import { useState } from "react";
import { useTheme } from "./Footer/Modo_Nocturno";
import { useFontSize } from "./Footer/Modificador_Letras";

export default function NavbarUser() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const [modalOpen, setModalOpen] = useState(false)
    const { modoNocturno } = useTheme();
    const { fontSize } = useFontSize();


    if (!user) return null
    return (
        <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'end', flexDirection: 'column', gap: '10px', position: "relative", height: '100%' }}>
            <div className={styles.containerUser} onClick={() => { setModalOpen(!modalOpen) }}>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}

                >
                    <img
                        src={user?.user_metadata?.picture || '../src/assets/react.svg'}
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                </div>
            </div>

            {modalOpen == true && (
                <div style={{ position: 'absolute', backgroundColor: modoNocturno ? "#2d2d2d" : 'white', borderRadius: '15px', padding: 10, pointerEvents: 'auto', width: '200px', top: '60px', border: '1px solid #ccc' }}>
                    <div >
                        <p style={{ color: modoNocturno ? "#fff" : "", fontWeight: 400, cursor: 'pointer', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', fontSize: `${fontSize}rem`, textTransform: 'capitalize' }}>{user?.user_metadata.full_name} </p>
                        <p style={{ fontSize: `${fontSize}rem`, color: modoNocturno ? "#fff" : 'gray', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{user?.email} </p>
                    </div>
                    <hr style={{ marginTop: 10 }} />
                    <div className={styles.opt}>
                        <button className={styles.btnNavegacion} onClick={() => { navigate(`/usuario/perfil/${user.id}`) }} style={{ fontSize: `${fontSize}rem`, color: modoNocturno ? "#fff" : "", display: 'block' }}>Ver perfil</button>
                        <button className={styles.btnNavegacion} onClick={() => { navigate(`/usuarios/editar/${user.id}`) }} style={{ fontSize: `${fontSize}rem`, color: modoNocturno ? "#fff" : "", display: 'block' }}>Editar perfil</button>
                    </div>

                    <button style={{ fontSize: `${fontSize}rem` }} className={styles.btnCerrarSesion} onClick={signOut}>
                        Cerrar sesión  <FontAwesomeIcon icon={faRightFromBracket} />
                    </button>
                </div>

            )
            }
        </div >

    )

}