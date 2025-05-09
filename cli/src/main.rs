use clap::Parser;

/// Simple CLI for ai-ide
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Cli {
    /// Activate loading page
    #[arg(long)]
    loading: bool,
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    if cli.loading {
        println!("Loading page auth stub (implement logic here)");
    }
    Ok(())
}
