import PDFJSAnnotate from '../PDFJSAnnotate';
import { appendChild } from '../render/appendChild';
import {
  disableUserSelect,
  enableUserSelect,
  findSVGAtPoint,
  getMetadata,
  convertToSvgPoint
} from './utils';

let _enabled = false;
let _candraw = false;
let _penSize;
let _penColor;
let path;
let counter = 0;
let lines = [];

/**
 * Handle document.mousedown event
 */
function handleDocumentPointerdown(e) {
  path = null;
  lines = [];
  counter = 9;
  _candraw = true;
}

/**
 * Handle document.mouseup event
 *
 * @param {Event} e The DOM event to be handled
 */
function handleDocumentPointerup(e) {
  _candraw = false;
  let svg;
  if (lines.length > 1 && (svg = findSVGAtPoint(e.clientX, e.clientY))) {
    let { documentId, pageNumber } = getMetadata(svg);

    PDFJSAnnotate.getStoreAdapter().addAnnotation(documentId, pageNumber, {
        type: 'drawing',
        width: _penSize,
        color: _penColor,
        lines
      }
    ).then((annotation) => {
      if (path) {
        svg.removeChild(path);
      }

      appendChild(svg, annotation);
    });
  }
}

/**
 * Handle document.mousemove event
 *
 * @param {Event} e The DOM event to be handled
 */
function handleDocumentPointermove(e) {
  if(_candraw){
    console.log(counter);
    counter++;
    savePoint(e.clientX, e.clientY);
  }
}

/**
 * Handle document.keyup event
 *
 * @param {Event} e The DOM event to be handled
 */
function handleDocumentKeyup(e) {
  // Cancel rect if Esc is pressed
  if (e.keyCode === 27) {
    lines = null;
    path.parentNode.removeChild(path);
    document.removeEventListener('pointermove', handleDocumentPointermove);
    document.removeEventListener('pointerup', handleDocumentPointerup);
  }
}

/**
 * Save a point to the line being drawn.
 *
 * @param {Number} x The x coordinate of the point
 * @param {Number} y The y coordinate of the point
 */
function savePoint(x, y) {
  let svg = findSVGAtPoint(x, y);
  if (!svg) {
    return;
  }

  let rect = svg.getBoundingClientRect();
  let point = convertToSvgPoint([
    x - rect.left,
    y - rect.top
  ], svg);

  lines.push(point);

  if (lines.length <= 1) {
    return;
  }

  if (path) {
    svg.removeChild(path);
  }

  path = appendChild(svg, {
    type: 'drawing',
    color: _penColor,
    width: _penSize,
    lines
  });
}

/**
 * Set the attributes of the pen.
 *
 * @param {Number} penSize The size of the lines drawn by the pen
 * @param {String} penColor The color of the lines drawn by the pen
 */
export function setPen(penSize = 1, penColor = '000000') {
  _penSize = parseInt(penSize, 10);
  _penColor = penColor;
}

/**
 * Enable the pen behavior
 */
export function enablePen() {
  if (_enabled) { return; }

  _enabled = true;
  document.addEventListener('pointerdown', handleDocumentPointerdown);
  document.addEventListener('pointermove', handleDocumentPointermove);
  document.addEventListener('pointerup', handleDocumentPointerup);
  document.addEventListener('keyup', handleDocumentKeyup);
  disableUserSelect();
}

/**
 * Disable the pen behavior
 */
export function disablePen() {
  if (!_enabled) { return; }

  _enabled = false;
  document.removeEventListener('pointerdown', handleDocumentPointerdown);
  document.removeEventListener('keyup', handleDocumentKeyup);
  enableUserSelect();
}

