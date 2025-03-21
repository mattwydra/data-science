# app.py
from flask import Flask, render_template, request, jsonify
import plotly
import plotly.express as px
import pandas as pd
import json
import sqlite3
from datetime import datetime
import os
import requests
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)

# Database setup
def setup_database():
    conn = sqlite3.connect('dashboard.db')
    c = conn.cursor()
    
    # Create tables for user data and filters
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        created_at TIMESTAMP
    )
    ''')
    
    c.execute('''
    CREATE TABLE IF NOT EXISTS saved_filters (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        filter_name TEXT,
        start_date TEXT,
        end_date TEXT,
        location TEXT,
        created_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    conn.commit()
    conn.close()

# Sample dataset - COVID-19 data (we'll fetch this from an API in production)
def get_initial_data():
    # For demo purposes, we'll use a static dataset
    # In production, we'd fetch from an API
    if not os.path.exists('data'):
        os.makedirs('data')
    
    if not os.path.exists('data/covid_data.csv'):
        # Create sample data
        dates = pd.date_range(start='2023-01-01', end='2023-12-31')
        countries = ['USA', 'UK', 'Germany', 'India', 'Brazil']
        
        data = []
        for country in countries:
            for date in dates:
                # Simulate some data
                cases = int(100 * (1 + 0.1 * date.day) * (1 + 0.2 * date.month))
                recovered = int(cases * 0.7)
                deaths = int(cases * 0.01)
                
                data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'country': country,
                    'cases': cases,
                    'recovered': recovered,
                    'deaths': deaths
                })
        
        df = pd.DataFrame(data)
        df.to_csv('data/covid_data.csv', index=False)
    
    return pd.read_csv('data/covid_data.csv')

# Function to fetch updated data from external API
def update_data():
    # In a real implementation, you would fetch fresh data
    # For example:
    # response = requests.get('https://disease.sh/v3/covid-19/historical?lastdays=all')
    # data = response.json()
    # process the data and save to csv or database
    
    print(f"Data updated at {datetime.now()}")
    
    # For demo, we'll just touch the file to update its timestamp
    with open('data/covid_data.csv', 'a') as f:
        f.write('')

# Set up scheduler for automatic data updates
scheduler = BackgroundScheduler()
scheduler.add_job(func=update_data, trigger="interval", hours=24)

# Route for main dashboard
@app.route('/')
def index():
    return render_template('index.html')

# API endpoint to get filtered data
@app.route('/api/data')
def get_data():
    # Get filter parameters
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    location = request.args.get('location', None)
    
    df = pd.read_csv('data/covid_data.csv')
    
    # Apply filters
    df = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
    if location:
        df = df[df['country'] == location]
    
    # Create visualizations
    fig_cases = px.line(df, x='date', y='cases', color='country', 
                         title='COVID-19 Cases Over Time')
    fig_cases.update_layout(xaxis_title='Date', yaxis_title='Number of Cases')
    
    fig_deaths = px.line(df, x='date', y='deaths', color='country',
                         title='COVID-19 Deaths Over Time')
    fig_deaths.update_layout(xaxis_title='Date', yaxis_title='Number of Deaths')
    
    # Create a pie chart showing distribution by country
    country_total = df.groupby('country')['cases'].sum().reset_index()
    fig_pie = px.pie(country_total, values='cases', names='country', 
                     title='Distribution of Cases by Country')
    
    # Convert plots to JSON for JavaScript
    graphJSON_cases = json.dumps(fig_cases, cls=plotly.utils.PlotlyJSONEncoder)
    graphJSON_deaths = json.dumps(fig_deaths, cls=plotly.utils.PlotlyJSONEncoder)
    graphJSON_pie = json.dumps(fig_pie, cls=plotly.utils.PlotlyJSONEncoder)
    
    return jsonify({
        'line_cases': graphJSON_cases,
        'line_deaths': graphJSON_deaths,
        'pie_chart': graphJSON_pie,
        'countries': df['country'].unique().tolist(),
        'date_range': {
            'min': df['date'].min(),
            'max': df['date'].max()
        }
    })

# Route to save user filters
@app.route('/api/save_filter', methods=['POST'])
def save_filter():
    data = request.json
    
    # In production, you would authenticate the user
    user_id = 1  # default test user
    
    conn = sqlite3.connect('dashboard.db')
    c = conn.cursor()
    
    # Check if user exists, if not create
    c.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not c.fetchone():
        c.execute("INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
                 (user_id, f"user_{user_id}", datetime.now()))
    
    # Save the filter
    c.execute("""
    INSERT INTO saved_filters (user_id, filter_name, start_date, end_date, location, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, data.get('name'), data.get('start_date'), data.get('end_date'), 
          data.get('location'), datetime.now()))
    
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'message': 'Filter saved successfully'})

# Route to get saved filters
@app.route('/api/get_filters')
def get_filters():
    # In production, you would authenticate the user
    user_id = 1  # default test user
    
    conn = sqlite3.connect('dashboard.db')
    conn.row_factory = sqlite3.Row  # This enables column access by name
    c = conn.cursor()
    
    c.execute("""
    SELECT id, filter_name, start_date, end_date, location
    FROM saved_filters
    WHERE user_id = ?
    ORDER BY created_at DESC
    """, (user_id,))
    
    filters = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return jsonify({'filters': filters})

if __name__ == '__main__':
    # Initialize database and data
    setup_database()
    get_initial_data()
    
    # Start the scheduler
    scheduler.start()
    
    # Run the app
    app.run(debug=True)