


interface ScreenpipeQueryParams {
  startTime: string;
  endTime: string;
  contentType: "ocr" | "audio" | "all";
  query?: string;
  appName?: string;
  limit: number;
}

export async function queryScreenpipe(params: ScreenpipeQueryParams) {
  try {
    console.log("params", params);
    const queryParams = new URLSearchParams(
      Object.entries({
        q: params.query,
        offset: params.offset?.toString(),
        limit: params.limit.toString(),
        start_time: params.startTime,
        end_time: params.endTime,
        content_type: params.contentType,
        app_name: params.appName,
      }).filter(([_, v]) => v != null) as [string, string][]
    );
    console.log("calling screenpipe", JSON.stringify(params));
    const response = await fetch(`http://localhost:3030/search?${queryParams}`);
    if (!response.ok) {
      const text = await response.text();
      console.log("error", text);
      throw new Error(`HTTP error! status: ${response.status} ${text}`);
    }
    const result = await response.json();
    console.log("result", result.data.length);
    // log all without .data
    console.log("result", {
      ...result,
      data: undefined,
    });
    return result;
  } catch (error) {
    console.error("Error querying screenpipe:", error);
    return null;
  }
}

export async function analyzeProductivity(days: number) {
  const endTime = new Date();
  const startTime = new Date(endTime);
  startTime.setDate(startTime.getDate() - days);

  const result = await queryScreenpipe({
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    contentType: "ocr",
    limit: 1000,
  });

  const appUsage = groupBy(result.data, 'content.app_name');
  
  const productivityData = Object.entries(appUsage).map(([app, usage]) => ({
    app,
    interactions: usage.length,
    hours: usage.length / 60, // Assuming each interaction is roughly 1 minute
  }));

  // Sort apps by usage time
  productivityData.sort((a, b) => b.hours - a.hours);

  // Calculate total hours
  const totalHours = productivityData.reduce((sum, app) => sum + app.hours, 0);

  return {
    totalHours,
    appUsage: productivityData,
    topApps: productivityData.slice(0, 5), // Top 5 apps by usage
  };
}

export async function summarizeMeeting(startTime: string, endTime: string) {
  const result = await queryScreenpipe({
    startTime,
    endTime,
    contentType: "audio",
    limit: 1000,
  });

  const transcripts = result.data.map(item => item.content.transcription).join(' ');
  
  // Here you would typically use an AI model to summarize the transcript
  // For this example, we'll just return some basic statistics
  const wordCount = transcripts.split(/\s+/).length;
  const durationInMinutes = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60);

  return {
    transcript: transcripts,
    statistics: {
      wordCount,
      durationInMinutes,
      averageWordsPerMinute: wordCount / durationInMinutes,
    },
    // You might want to add more analysis here, such as:
    // - Key topics discussed (using NLP)
    // - Action items (using NLP)
    // - Participants (if that data is available)
  };
}

export async function trackProjectTime(projectKeyword: string, days: number) {
  const endTime = new Date();
  const startTime = new Date(endTime);
  startTime.setDate(startTime.getDate() - days);

  const result = await queryScreenpipe({
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    contentType: "ocr",
    query: projectKeyword,
    limit: 1000,
  });

  const totalHours = days * 24;
  const projectHours = result.data.length / 60;

  // Group project time by day
  const dailyUsage = groupBy(result.data, item => 
    new Date(item.content.timestamp).toISOString().split('T')[0]
  );

  const dailyStats = Object.entries(dailyUsage).map(([date, usage]) => ({
    date,
    hours: usage.length / 60,
    percentage: (usage.length / 60) / 24 * 100,
  }));

  return {
    totalPeriodHours: totalHours,
    totalProjectHours: projectHours,
    averageHoursPerDay: projectHours / days,
    percentageOfTime: (projectHours / totalHours) * 100,
    dailyBreakdown: dailyStats,
  };
}

function groupBy(array: any[], keyOrFn: string | ((item: any) => string)) {
  return array.reduce((result, item) => {
    const key = typeof keyOrFn === 'function' ? keyOrFn(item) : item[keyOrFn];
    (result[key] = result[key] || []).push(item);
    return result;
  }, {});
}