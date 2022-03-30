const pageHeaderClasses = "row text-center justify-content-center"
const pageHeaderStyle = {
    color: "black",
    fontSize: "2.5vw"
}

function Home() {
  return (
    <>
        <div className={pageHeaderClasses} style={pageHeaderStyle}>
          SmartSeal Home
        </div>
    </>
  );
}

export default Home;
