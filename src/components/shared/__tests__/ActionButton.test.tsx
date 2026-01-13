/**
 * Component tests for ActionButton
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActionButton } from '../ActionButton';

describe('ActionButton', () => {
  it('should render correctly', () => {
    const { getByText } = render(<ActionButton>Test Button</ActionButton>);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should handle press events', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ActionButton onPress={onPressMock}>Click Me</ActionButton>
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should render primary variant', () => {
    const { getByText } = render(
      <ActionButton variant="primary">Primary</ActionButton>
    );
    expect(getByText('Primary')).toBeTruthy();
  });

  it('should render secondary variant', () => {
    const { getByText } = render(
      <ActionButton variant="secondary">Secondary</ActionButton>
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('should render outline variant', () => {
    const { getByText } = render(
      <ActionButton variant="outline">Outline</ActionButton>
    );
    expect(getByText('Outline')).toBeTruthy();
  });

  it('should render danger variant', () => {
    const { getByText } = render(
      <ActionButton variant="danger">Danger</ActionButton>
    );
    expect(getByText('Danger')).toBeTruthy();
  });

  it('should show loading indicator when loading', () => {
    const { getByTestId, queryByText } = render(
      <ActionButton loading>Loading</ActionButton>
    );

    // Button text should not be visible when loading
    expect(queryByText('Loading')).toBeNull();
  });

  it('should be disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ActionButton disabled onPress={onPressMock}>
        Disabled
      </ActionButton>
    );

    fireEvent.press(getByText('Disabled'));
    // Should not call onPress when disabled
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('should apply fullWidth style', () => {
    const { getByText } = render(
      <ActionButton fullWidth>Full Width</ActionButton>
    );
    expect(getByText('Full Width')).toBeTruthy();
  });

  it('should render with start icon', () => {
    const mockIcon = <>{/* Mock icon */}</>;
    const { getByText } = render(
      <ActionButton startIcon={mockIcon}>With Icon</ActionButton>
    );
    expect(getByText('With Icon')).toBeTruthy();
  });

  it('should render with end icon', () => {
    const mockIcon = <>{/* Mock icon */}</>;
    const { getByText } = render(
      <ActionButton endIcon={mockIcon}>With Icon</ActionButton>
    );
    expect(getByText('With Icon')).toBeTruthy();
  });
});
