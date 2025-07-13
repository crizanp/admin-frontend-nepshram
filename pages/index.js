// pages/index.js
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Auth System</title>
      </Head>
      
      <div className="card">
        <h1>Welcome to Auth System</h1>
        <p>A simple authentication system with user and admin panels.</p>
        
        <div style={{ marginTop: '20px' }}>
          <Link href="/register" className="btn btn-primary" style={{ marginRight: '10px' }}>
            Get Started
          </Link>
          <Link href="/login" className="btn btn-success">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
