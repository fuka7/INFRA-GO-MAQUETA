(function() {
  const script = document.createElement('script');
  script.src = 'https://assistloop.ai/assistloop-widget.js';

  script.onload = function() {
    AssistLoopWidget.init({
      agentId: "5c9abdaa-257f-4d67-8ea5-8d4c52f3d4e4"
    });
  };

  document.head.appendChild(script);
})();