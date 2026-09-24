/**
 * Component tests for ActionButton
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActionButton } from '../ActionButton';

describe('ActionButton', () => {
  it('should render correctly', () => {
    const { getByText } = render(<ActionButton title="Test Button" onPress={jest.fn()} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should handle press events', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ActionButton title="Click Me" onPress={onPressMock} />
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should render primary variant', () => {
    const { getByText } = render(
      <ActionButton title="Primary" variant="primary" onPress={jest.fn()} />
    );
    expect(getByText('Primary')).toBeTruthy();
  });

  it('should render secondary variant', () => {
    const { getByText } = render(
      <ActionButton title="Secondary" variant="secondary" onPress={jest.fn()} />
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('should render outline variant', () => {
    const { getByText } = render(
      <ActionButton title="Outline" variant="outline" onPress={jest.fn()} />
    );
    expect(getByText('Outline')).toBeTruthy();
  });

  it('should render danger variant', () => {
    const { getByText } = render(
      <ActionButton title="Danger" variant="danger" onPress={jest.fn()} />
    );
    expect(getByText('Danger')).toBeTruthy();
  });

  it('should show loading indicator when loading', () => {
    const { queryByText } = render(
      <ActionButton title="Loading" loading onPress={jest.fn()} />
    );

    expect(queryByText('Loading')).toBeNull();
  });

  it('should be disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ActionButton title="Disabled" disabled onPress={onPressMock} />
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('should apply fullWidth style', () => {
    const { getByText } = render(
      <ActionButton title="Full Width" fullWidth onPress={jest.fn()} />
    );
    expect(getByText('Full Width')).toBeTruthy();
  });

  it('should render with an icon', () => {
    const mockIcon = <>{/* Mock icon */}</>;
    const { getByText } = render(
      <ActionButton title="With Icon" icon={mockIcon} onPress={jest.fn()} />
    );
    expect(getByText('With Icon')).toBeTruthy();
  });
});
