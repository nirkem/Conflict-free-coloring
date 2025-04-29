from main import generate_conflict_free_coloring, PointsRequest

def test_generate_conflict_free_coloring():
    # Define the input JSON
    input_data = {
        "points": [
            { "x": 0.1, "y": 0.1, "color": 0 },
            { "x": 0.2, "y": 0.2, "color": 0 },
            { "x": 0.3, "y": 0.3, "color": 0 },
            { "x": 0.4, "y": 0.4, "color": 0 },
            { "x": 0.5, "y": 0.5, "color": 0 },
            { "x": 0.6, "y": 0.6, "color": 0 },
            { "x": 0.7, "y": 0.7, "color": 0 },
            { "x": 0.8, "y": 0.8, "color": 0 },
            { "x": 0.9, "y": 0.9, "color": 0 }
        ]
    }

    # Convert the input JSON to a PointsRequest object
    request = PointsRequest(**input_data)

    # Call the function
    response = generate_conflict_free_coloring(request)

    # Print the response
    print("Response:", response)

# Run the test
test_generate_conflict_free_coloring()