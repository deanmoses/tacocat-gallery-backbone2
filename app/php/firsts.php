<?php
	$filename = "/home/deanmoses/includes/pix/firsts/firsts.txt";
	
	header('Content-Type: application/json');
	
	$contents = file_get_contents($filename);
	
	$years;
	$yearStrings = explode('==', $contents);
	foreach ($yearStrings as $yearString) {
		//print("Year string: $yearString");
		$firstStrings = explode("\n\n", $yearString);
		$year = array_shift($firstStrings);
		if (!$year) continue;
		//print("------------Year: " . $yearObj['year'] . "--------------\n\n");
		$years[$year] = array();
		foreach($firstStrings as $firstString) {
			$firstParts = explode("\n", $firstString);
			//print("**** firstParts: " . $firstParts . " *******\n\n");
			if (count($firstParts) <= 1) continue;
			$first = array(
				"what" => $firstParts[0],
				"when" => $firstParts[1],
				"who" => $firstParts[2]
			);
			
			array_push($years[$year], $first);
		}
	}
	
	//print $years;
	
	print(json_encode($years));
?>