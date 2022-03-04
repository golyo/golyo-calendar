import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import assert from 'assert';

test('renders home menu', () => {
  render(<App/>);
  const linkElement = screen.getAllByText(/UserCalendar/i);
  assert(linkElement.length > 0, 'UserCalendar string must be in html !');
  expect(linkElement[0]).toBeInTheDocument();
});
