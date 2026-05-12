Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$OutDir = Join-Path $PSScriptRoot 'game-map-images'
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

function Color($hex) {
  [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Brush($hex) {
  New-Object System.Drawing.SolidBrush (Color $hex)
}

function Pen($hex, $width = 1) {
  New-Object System.Drawing.Pen (Color $hex), $width
}

$FontMain = New-Object System.Drawing.Font 'Consolas', 18, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$FontSmall = New-Object System.Drawing.Font 'Consolas', 14, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$FontTitle = New-Object System.Drawing.Font 'Consolas', 34, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$FontNode = New-Object System.Drawing.Font 'Consolas', 17, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$FontTiny = New-Object System.Drawing.Font 'Consolas', 12, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)

function New-Canvas($width, $height, $title) {
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.Clear((Color '#050705'))

  $bgPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(26, 0, 255, 65)), 1
  for ($y = 0; $y -lt $height; $y += 8) {
    $g.DrawLine($bgPen, 0, $y, $width, $y)
  }
  $bgPen.Dispose()

  $g.FillRectangle((Brush '#071107'), 28, 28, $width - 56, 74)
  $g.DrawRectangle((Pen '#1a3a1a' 2), 28, 28, $width - 56, 74)
  $g.DrawString($title.ToUpperInvariant(), $FontTitle, (Brush '#00ff41'), 52, 48)
  $g.DrawString('EXECUTIVE DISFUNCTION // TEXT ADVENTURE MAP', $FontSmall, (Brush '#4a7a4a'), $width - 560, 62)

  return @{ Bitmap = $bmp; Graphics = $g }
}

function Save-Canvas($canvas, $name) {
  $path = Join-Path $OutDir $name
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
  Write-Host $path
}

function Node($id, $label, $x, $y, $w = 210, $h = 58, $kind = 'room') {
  [pscustomobject]@{ Id = $id; Label = $label; X = $x; Y = $y; W = $w; H = $h; Kind = $kind }
}

function Edge($from, $to, $label = '', $twoWay = $false) {
  [pscustomobject]@{ From = $from; To = $to; Label = $label; TwoWay = $twoWay }
}

function Draw-Node($g, $node) {
  $label = $node.Label -replace '\\n', "`n"
  $fill = switch ($node.Kind) {
    'mini' { '#101508' }
    'action' { '#071407' }
    'distraction' { '#130f05' }
    'ending' { '#120707' }
    default { '#081108' }
  }
  $border = switch ($node.Kind) {
    'mini' { '#ffb000' }
    'action' { '#00cc33' }
    'distraction' { '#8c6a08' }
    'ending' { '#ff3333' }
    default { '#1a7a2a' }
  }
  $text = switch ($node.Kind) {
    'mini' { '#ffb000' }
    'distraction' { '#d5ad39' }
    'ending' { '#ff7777' }
    default { '#b0ffb0' }
  }

  $rect = New-Object System.Drawing.RectangleF $node.X, $node.Y, $node.W, $node.H
  $g.FillRectangle((Brush $fill), $rect)
  $g.DrawRectangle((Pen $border 2), $node.X, $node.Y, $node.W, $node.H)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($label, $FontNode, (Brush $text), $rect, $format)
}

function Draw-Edge($g, $nodes, $edge) {
  $from = $nodes[$edge.From]
  $to = $nodes[$edge.To]
  if (-not $from -or -not $to) { return }

  $x1 = $from.X + $from.W / 2
  $y1 = $from.Y + $from.H / 2
  $x2 = $to.X + $to.W / 2
  $y2 = $to.Y + $to.H / 2
  $pen = Pen '#3a7a3a' 2
  $cap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap 5, 6
  $pen.CustomEndCap = $cap
  if ($edge.TwoWay) {
    $pen.CustomStartCap = $cap
  }
  $g.DrawLine($pen, $x1, $y1, $x2, $y2)

  if ($edge.Label) {
    $mx = ($x1 + $x2) / 2
    $my = ($y1 + $y2) / 2
    $size = $g.MeasureString($edge.Label, $FontTiny)
    $g.FillRectangle((Brush '#050705'), $mx - $size.Width / 2 - 4, $my - $size.Height / 2 - 2, $size.Width + 8, $size.Height + 4)
    $g.DrawString($edge.Label, $FontTiny, (Brush '#ffb000'), $mx - $size.Width / 2, $my - $size.Height / 2)
  }
  $pen.Dispose()
}

function Draw-Graph($title, $file, $width, $height, $nodeList, $edgeList, $legend = $true) {
  $canvas = New-Canvas $width $height $title
  $g = $canvas.Graphics
  $nodes = @{}
  foreach ($n in $nodeList) { $nodes[$n.Id] = $n }
  foreach ($e in $edgeList) { Draw-Edge $g $nodes $e }
  foreach ($n in $nodeList) { Draw-Node $g $n }
  if ($legend) {
    $g.DrawString('green = room/action   amber = mini game/distraction   red = ending', $FontSmall, (Brush '#4a7a4a'), 52, $height - 44)
  }
  Save-Canvas $canvas $file
}

$roomNodes = @(
  Node 'bedroom' 'Bedroom' 80 190
  Node 'bathroomHome' 'Bathroom Home' 80 330
  Node 'hallway' 'Hallway' 360 260
  Node 'homeOffice' 'Home Office' 360 120
  Node 'kitchen' 'Kitchen' 640 260
  Node 'backyard' 'Backyard' 640 410
  Node 'frontGarden' 'Front Garden' 920 260
  Node 'commute' 'Commute' 1200 260
  Node 'officeLobby' 'Office Lobby' 1480 260
  Node 'breakRoom' 'Break Room' 1480 410
  Node 'openPlan' 'Open Plan Office' 1760 260
  Node 'colleagueDesk' "Colleague's Desk" 1760 110
  Node 'meetingRoom' 'Meeting Room' 2040 260
  Node 'bathroomWork' 'Work Bathroom' 2040 410
  Node 'yourDesk' 'Your Desk' 1760 560
  Node 'supplyCloset' 'Supply Closet' 2040 560
)
$roomEdges = @(
  Edge 'bedroom' 'bathroomHome' '' $true
  Edge 'bedroom' 'hallway' '' $true
  Edge 'hallway' 'homeOffice' '' $true
  Edge 'hallway' 'kitchen' '' $true
  Edge 'kitchen' 'backyard' '' $true
  Edge 'hallway' 'frontGarden' 'leave house'
  Edge 'frontGarden' 'hallway' 'forgot something'
  Edge 'frontGarden' 'commute'
  Edge 'commute' 'officeLobby'
  Edge 'officeLobby' 'openPlan'
  Edge 'officeLobby' 'breakRoom' '' $true
  Edge 'openPlan' 'colleagueDesk' '' $true
  Edge 'openPlan' 'meetingRoom' '' $true
  Edge 'meetingRoom' 'bathroomWork' '' $true
  Edge 'openPlan' 'yourDesk' '' $true
  Edge 'yourDesk' 'supplyCloset' '' $true
)
Draw-Graph 'Room Flow' '01-room-flow.png' 2320 760 $roomNodes $roomEdges

$miniNodes = @(
  Node 'bedroom' 'Bedroom' 100 160
  Node 'openPlan' 'Open Plan Office' 100 330
  Node 'meetingRoom' 'Meeting Room' 100 500
  Node 'colleagueDesk' "Colleague's Desk" 100 670
  Node 'yourDesk' 'Your Desk' 100 840
  Node 'doom' 'Doom Scroll' 560 160 250 64 'mini'
  Node 'timeBlind' 'Time Blindness' 560 330 250 64 'mini'
  Node 'meeting' 'The Meeting' 560 500 250 64 'mini'
  Node 'pixel' 'Pixel Perfect' 920 500 250 64 'mini'
  Node 'fish' 'Fish Tank Hypnosis' 560 670 250 64 'mini'
  Node 'priority' 'Priority Queue' 560 840 250 64 'mini'
  Node 'context' 'Context Switch' 920 925 250 64 'mini'
)
$miniEdges = @(
  Edge 'bedroom' 'doom' 'phone notifications'
  Edge 'openPlan' 'timeBlind' 'urgent email'
  Edge 'meetingRoom' 'meeting' 'attend'
  Edge 'meetingRoom' 'pixel' 'presentation'
  Edge 'colleagueDesk' 'fish' 'fish screensaver'
  Edge 'yourDesk' 'priority' 'write report'
  Edge 'yourDesk' 'timeBlind' 'timesheet'
  Edge 'yourDesk' 'context' 'resume work'
)
Draw-Graph 'Mini Game Triggers' '02-mini-game-triggers.png' 1260 1100 $miniNodes $miniEdges

$choiceNodes = @(
  Node 'bedroom' 'Bedroom' 90 170
  Node 'home1' "Medication\nPhone\nDoom Scroll\nCeiling" 90 285 230 96 'action'
  Node 'bathroom' "Home Bathroom\nBrush / mirror / shower" 90 450 230 88 'action'
  Node 'hallway' 'Hallway' 430 250
  Node 'hallChoices' "Keys\nTry leave\nLeave house" 430 365 230 86 'action'
  Node 'homeOffice' "Home Office\nReport draft\nHeadphones\nTabs" 430 520 230 102 'action'
  Node 'kitchen' 'Kitchen' 770 250
  Node 'kitchenChoices' "Coffee\nBreakfast\nTravel card\nKettle scroll" 770 365 230 104 'action'
  Node 'backyard' "Backyard\nPlant / stand" 770 540 230 78 'distraction'
  Node 'frontGarden' 'Front Garden' 1110 250
  Node 'gardenChoices' "Forgot something\nShiny object\nBin day" 1110 365 230 96 'distraction'
  Node 'commute' 'Commute' 1450 250
  Node 'commuteChoices' "Podcast\nPlan day\nScroll journey" 1450 365 230 92 'distraction'
  Node 'officeLobby' 'Office Lobby' 1790 250
  Node 'lobbyChoices' "Badge in\nConversation trap" 1790 365 230 78 'action'
  Node 'breakRoom' "Break Room\nCoffee\nFridge note" 1790 530 230 92 'action'
  Node 'openPlan' 'Open Plan Office' 2130 250
  Node 'openChoices' "Emails\nUrgent reply\nReorganise" 2130 365 230 92 'action'
  Node 'colleague' "Colleague Desk\nAsk colleague\nFish Tank" 2130 520 230 92 'mini'
  Node 'meeting' "Meeting Room\nMeeting\nPixel Perfect" 2470 250 230 92 'mini'
  Node 'workBath' "Work Bathroom\nBreak\nPhone" 2470 420 230 78 'action'
  Node 'desk' "Your Desk\nReport\nTimesheet\nContext Switch\nSend report" 2130 690 250 128 'mini'
  Node 'closet' "Supply Closet\nLabel maker\nChair" 2470 690 230 92 'action'
)
$choiceEdges = @(
  Edge 'bedroom' 'home1'
  Edge 'bedroom' 'bathroom' '' $true
  Edge 'bedroom' 'hallway' '' $true
  Edge 'hallway' 'hallChoices'
  Edge 'hallway' 'homeOffice' '' $true
  Edge 'hallway' 'kitchen' '' $true
  Edge 'kitchen' 'kitchenChoices'
  Edge 'kitchen' 'backyard' '' $true
  Edge 'hallway' 'frontGarden' 'leave'
  Edge 'frontGarden' 'gardenChoices'
  Edge 'frontGarden' 'hallway' 'forgot once'
  Edge 'frontGarden' 'commute'
  Edge 'commute' 'commuteChoices'
  Edge 'commute' 'officeLobby'
  Edge 'officeLobby' 'lobbyChoices'
  Edge 'officeLobby' 'breakRoom' '' $true
  Edge 'officeLobby' 'openPlan'
  Edge 'openPlan' 'openChoices'
  Edge 'openPlan' 'colleague' '' $true
  Edge 'openPlan' 'meeting' '' $true
  Edge 'meeting' 'workBath' '' $true
  Edge 'openPlan' 'desk' '' $true
  Edge 'desk' 'closet' '' $true
)
Draw-Graph 'Choice Map' '03-choice-map.png' 2780 920 $choiceNodes $choiceEdges

$internalNodes = @(
  Node 'doom' 'Doom Scroll' 100 180 220 58 'mini'
  Node 'doomFlow' "Scroll repeatedly\nor put phone down\nresolve by scroll count" 420 160 300 100 'action'
  Node 'meeting' 'The Meeting' 100 350 220 58 'mini'
  Node 'meetingFlow' "Engage / zone out\n8 rounds\nresolve engagement ratio" 420 330 300 100 'action'
  Node 'time' 'Time Blindness' 100 520 220 58 'mini'
  Node 'timeFlow' "Guess duration\n5 / 15 / 30 / 60\nresolve by hidden gap" 420 500 300 100 'action'
  Node 'context' 'Context Switch' 100 690 220 58 'mini'
  Node 'contextFlow' "Memorize 4 words\nselect 4 from mixed list\nresolve correct count" 420 670 300 100 'action'
  Node 'priority' 'Priority Queue' 840 180 220 58 'mini'
  Node 'priorityFlow' "Play cards\nprogress tasks\npressure at turn end\nwon / partial / lost" 1160 150 320 118 'action'
  Node 'pixel' 'Pixel Perfect' 840 390 220 58 'mini'
  Node 'pixelFlow' "Select slide element\nnudge 3px\n12 action budget\ngood enough or auto end" 1160 350 340 130 'action'
  Node 'fish' 'Fish Tank Hypnosis' 840 620 240 58 'mini'
  Node 'fishFlow' "Select fish\nkeep watching / name / research\nwalk away early\nresolve fascination" 1160 585 340 130 'action'
)
$internalEdges = @(
  Edge 'doom' 'doomFlow'
  Edge 'meeting' 'meetingFlow'
  Edge 'time' 'timeFlow'
  Edge 'context' 'contextFlow'
  Edge 'priority' 'priorityFlow'
  Edge 'pixel' 'pixelFlow'
  Edge 'fish' 'fishFlow'
)
Draw-Graph 'Mini Game Internals' '04-mini-game-internals.png' 1580 860 $internalNodes $internalEdges

$endingNodes = @(
  Node 'end' 'End of Day' 80 430 200 62 'ending'
  Node 'never' "THE HOUSE WON\nnever left house\nand time <= 10" 420 100 300 104 'ending'
  Node 'office' "OFFICE, TECHNICALLY\nreached office\nand time/focus hit 0" 420 250 300 116 'ending'
  Node 'transit' "LOST IN TRANSIT\nreached commute, not office\nand time/focus hit 0" 420 420 330 116 'ending'
  Node 'noMeds' "RUNNING ON VIBES\nbadged in without meds" 420 590 300 92 'ending'
  Node 'closet' "THE CLOSET UNDERSTANDS\nfound supply closet chair" 840 100 340 92 'ending'
  Node 'functional' "SOMEHOW FUNCTIONAL\nall core tasks\nenough focus/time" 840 250 300 104 'ending'
  Node 'productive' "PRODUCTIVE CHAOS\nall core tasks\nany stats" 840 410 300 104 'ending'
  Node 'survived' "SURVIVED. BARELY.\n4+ actions\ntime > 0" 840 570 300 104 'ending'
  Node 'void' "HYPERFOCUS VOID\nchaos >= 80\ntime > 0" 1240 260 300 104 'ending'
  Node 'chaos' "CHAOS CONSUMED YOU\nfallback" 1240 450 300 82 'ending'
)
$endingEdges = @(
  Edge 'end' 'never'
  Edge 'end' 'office'
  Edge 'end' 'transit'
  Edge 'end' 'noMeds'
  Edge 'end' 'closet'
  Edge 'end' 'functional'
  Edge 'end' 'productive'
  Edge 'end' 'survived'
  Edge 'end' 'void'
  Edge 'end' 'chaos'
)
Draw-Graph 'Ending Logic' '05-ending-logic.png' 1640 780 $endingNodes $endingEdges
