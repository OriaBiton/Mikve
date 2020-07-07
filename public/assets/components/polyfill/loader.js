if (!'customElements' in window || 'customElements' in window == false){
  document.write(
    '<script src="assets/components/polyfill/webcomponents-bundle.js"></script>'
  );
  console.log('loaded polyfill');
}
