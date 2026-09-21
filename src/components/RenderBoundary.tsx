"use client";

import { Component, type ReactNode } from "react";

/** A failed model or unavailable WebGL must not crash the rest of the site. */
export default class RenderBoundary extends Component<{
  children: ReactNode;
  fallback?: ReactNode;
  onError?: () => void;
}, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError?.(); }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}
