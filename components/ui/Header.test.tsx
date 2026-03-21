/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { Header } from './Header';

expect.extend(matchers);

describe('Header Component', () => {
    const mockToggleAudio = vi.fn();
    const mockTogglePhoto = vi.fn();
    const mockOnGenerate = vi.fn();

    const defaultProps = {
        audioEnabled: true,
        toggleAudio: mockToggleAudio,
        togglePhoto: mockTogglePhoto,
        onGenerate: mockOnGenerate,
        isLoading: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders title and tagline correctly', () => {
        render(<Header {...defaultProps} />);
        expect(screen.getByText('AETHERIA')).toBeInTheDocument();
        expect(screen.getByText('PLANETARY SIMULATION ENGINE v1.2')).toBeInTheDocument();
    });

    it('shows "Audio ON" and calls toggleAudio when clicked if audioEnabled is true', () => {
        render(<Header {...defaultProps} audioEnabled={true} />);
        const audioButton = screen.getByText('Audio ON');
        expect(audioButton).toBeInTheDocument();
        expect(audioButton).toHaveClass('bg-green-900/30');

        fireEvent.click(audioButton);
        expect(mockToggleAudio).toHaveBeenCalledTimes(1);
    });

    it('shows "Audio OFF" and calls toggleAudio when clicked if audioEnabled is false', () => {
        render(<Header {...defaultProps} audioEnabled={false} />);
        const audioButton = screen.getByText('Audio OFF');
        expect(audioButton).toBeInTheDocument();
        expect(audioButton).toHaveClass('bg-gray-900/30');

        fireEvent.click(audioButton);
        expect(mockToggleAudio).toHaveBeenCalledTimes(1);
    });

    it('shows "Photo Mode" and calls togglePhoto when clicked', () => {
        render(<Header {...defaultProps} />);
        const photoButton = screen.getByText('Photo Mode');
        expect(photoButton).toBeInTheDocument();

        fireEvent.click(photoButton);
        expect(mockTogglePhoto).toHaveBeenCalledTimes(1);
    });

    it('shows "⟳ Generate World" and calls onGenerate when clicked if isLoading is false', () => {
        render(<Header {...defaultProps} isLoading={false} />);
        const generateButton = screen.getByText('⟳ Generate World');
        expect(generateButton).toBeInTheDocument();
        expect(generateButton).not.toBeDisabled();

        fireEvent.click(generateButton);
        expect(mockOnGenerate).toHaveBeenCalledTimes(1);
    });

    it('shows "Simulating...", is disabled and has correct classes when isLoading is true', () => {
        render(<Header {...defaultProps} isLoading={true} />);
        const generateButton = screen.getByText('Simulating...');
        expect(generateButton).toBeInTheDocument();
        expect(generateButton).toBeDisabled();
        expect(generateButton).toHaveClass('opacity-50');
        expect(generateButton).toHaveClass('cursor-not-allowed');

        fireEvent.click(generateButton);
        expect(mockOnGenerate).not.toHaveBeenCalled();
    });
});
