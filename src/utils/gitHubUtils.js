
export const fetchLatestCommitDate = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/guillermode20/plotcypher-react/commits');
    const commits = await response.json();
    const latestCommit = commits[0];
    return new Date(latestCommit.commit.author.date).toLocaleDateString();
  } catch (error) {
    console.error('Error fetching commit date:', error);
    return 'Unknown';
  }
};