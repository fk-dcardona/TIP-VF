import { render, screen } from '@testing-library/react';

describe('Simple Test', () => {
  it('should render basic content', () => {
    render(<div>Hello Test</div>);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
});