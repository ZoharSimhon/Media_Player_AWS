document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:3000/videoList')
      .then(response => response.json())
      .then(data => {
        const tableBody = document.querySelector('#videoTable tbody');
        data.forEach(video => {
          const row = document.createElement('tr');
          const cell = document.createElement('td');
          cell.textContent = video;
          cell.style.cursor = 'pointer';
          cell.onclick = () => {
            playVideo(video);
            setSelectedRow(row);
          };
          row.appendChild(cell);
          tableBody.appendChild(row);
        });
      })
      .catch(error => {
        console.error('Error fetching video list:', error);
      });
  });

  function playVideo(fileName) {
    fetch(`http://localhost:3000/getVideoUrl?fileName=${encodeURIComponent(fileName)}`)
      .then(response => response.json())
      .then(data => {
        const videoPlayer = document.getElementById('videoPlayer');
        const videoSource = document.getElementById('videoSource');
        videoSource.src = data.url;
        videoPlayer.style.display = 'block';
        videoPlayer.load();
        videoPlayer.play();
      })
      .catch(error => {
        console.error('Error fetching video URL:', error);
      });
  }

  function setSelectedRow(selectedRow) {
    const rows = document.querySelectorAll('#videoTable tbody tr');
    rows.forEach(row => row.classList.remove('selected'));
    selectedRow.classList.add('selected');
  }