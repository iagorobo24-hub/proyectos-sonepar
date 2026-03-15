import { Button, Badge, Input, Card, StreamIndicator } from '../components/ui'
import { useToast } from '../contexts/ToastContext'
import { Search } from 'lucide-react'
import { useState } from 'react'

/* UITest — página temporal para verificar los componentes UI de F2 */
/* ELIMINAR ANTES DE LA ENTREGA DEL PFC */
export default function UITest() {
  const { toast } = useToast()
  const [inputVal, setInputVal] = useState('')
  const streamDemo = 'Referencia: ATV320 Potencia: 2.2kW Tensión: 230V'

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', fontFamily: 'var(--font-sans)' }}>
      <h2 style={{ margin: 0, fontSize: '18px' }}>UITest — Componentes F2</h2>

      <section>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>BUTTON — variantes</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>Cargando</Button>
          <Button variant="primary" disabled>Desactivado</Button>
        </div>
      </section>

      <section>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>BUTTON — tamaños</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>BADGE — variantes</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge variant="stock-alto">Stock alto</Badge>
          <Badge variant="stock-medio">Stock medio</Badge>
          <Badge variant="stock-bajo">Stock bajo</Badge>
          <Badge variant="categoria">Variadores</Badge>
          <Badge variant="norma">IEC 60947</Badge>
        </div>
      </section>

      <section>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>INPUT</p>
        <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Input placeholder="Sin icono" value={inputVal} onChange={e => setInputVal(e.target.value)} />
          <Input placeholder="Con icono Search" iconLeft={<Search size={16} />} value={inputVal} onChange={e => setInputVal(e.target.value)} />
        </div>
      </section>

      <section>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>CARD</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Card padding="sm"><p style={{ margin: 0 }}>Card small</p></Card>
          <Card padding="md"><p style={{ margin: 0 }}>Card medium</p></Card>
          <Card padding="lg"><p style={{ margin: 0 }}>Card large</p></Card>
        </div>
      </section>

      <section>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>STREAM INDICATOR</p>
        <StreamIndicator
          campos={['Referencia', 'Potencia', 'Tensión', 'Corriente', 'Precio']}
          streamText={streamDemo}
        />
      </section>

      <section>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>TOAST</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={() => toast.show('Operación correcta', 'success')}>Toast success</Button>
          <Button variant="danger" onClick={() => toast.show('Ha ocurrido un error', 'error')}>Toast error</Button>
          <Button variant="ghost" onClick={() => toast.show('Aviso importante', 'warning')}>Toast warning</Button>
        </div>
      </section>
    </div>
  )
}
