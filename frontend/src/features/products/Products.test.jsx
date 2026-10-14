import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Products } from './Products.jsx';

describe('Productos demo', () => {
  it('muestra catálogo de Penpot y búsqueda con estado vacío', async () => {
    const user = userEvent.setup();
    render(<Products />);
    expect(screen.getByText('Combo familiar')).toBeInTheDocument();
    expect(screen.getByText('$48.000')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Buscar productos'), 'docena');
    expect(screen.getByText('Docena tradicional')).toBeInTheDocument();
    expect(screen.queryByText('Combo familiar')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Buscar productos'));
    await user.type(screen.getByLabelText('Buscar productos'), 'inexistente');
    expect(screen.getByText('No hay productos que coincidan.')).toBeInTheDocument();
  });

  it('valida, crea y edita un producto sin persistencia remota', async () => {
    const user = userEvent.setup();
    render(<Products />);
    await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
    await user.click(screen.getByRole('button', { name: 'Guardar producto demo' }));
    expect(screen.getByText('Escribe un nombre.')).toBeInTheDocument();
    expect(screen.getByText('El precio debe ser un entero positivo en pesos.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nombre'), '  Buñuelo especial  ');
    await user.type(screen.getByLabelText('Descripción'), 'Con queso');
    await user.type(screen.getByLabelText('Precio (COP)'), '3500');
    await user.click(screen.getByRole('button', { name: 'Guardar producto demo' }));
    expect(screen.getByText('Buñuelo especial')).toBeInTheDocument();
    expect(screen.getByText('$3.500')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar Buñuelo especial' }));
    await user.clear(screen.getByLabelText('Precio (COP)'));
    await user.type(screen.getByLabelText('Precio (COP)'), '4000');
    await user.click(screen.getByLabelText('Disponible para venta'));
    await user.click(screen.getByRole('button', { name: 'Guardar producto demo' }));
    expect(screen.getByText('$4.000')).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
  });

  it('cancelar no cambia el catálogo y restaura foco', async () => {
    const user = userEvent.setup();
    render(<Products />);
    const add = screen.getByRole('button', { name: 'Agregar producto' });
    await user.click(add);
    await user.type(screen.getByLabelText('Nombre'), 'No guardar');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('No guardar')).not.toBeInTheDocument();
    expect(add).toHaveFocus();
  });

  it.each(['0', '-1', '2.5', '9007199254740992'])('rechaza precio inválido %s', async price => {
    const user = userEvent.setup();
    render(<Products />);
    await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Precio inválido');
    await user.type(screen.getByLabelText('Precio (COP)'), price);
    await user.click(screen.getByRole('button', { name: 'Guardar producto demo' }));
    expect(screen.getByText('El precio debe ser un entero positivo en pesos.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar Precio inválido' })).not.toBeInTheDocument();
  });
});
