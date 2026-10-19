import logo from '../assets/logo.webp'

export default function Logo({ size = 40, className = '' }) {
  return <img src={logo} alt="" width={size} height={size} className={`logo ${className}`} />
}
